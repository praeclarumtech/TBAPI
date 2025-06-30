import {
  calculateJobScore,
  processResumeAndJD,
} from '../services/jobScoreService.js';
import { StatusCodes } from 'http-status-codes';
import Applicant from '../models/applicantModel.js';
import jobApplication from '../models/jobApplicantionModel.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { Message } from '../utils/constant/message.js';
import {
  extractTextFromDoc,
  extractTextFromDocx,
  extractTextFromPDF,
  parseResumeText,
} from '../helpers/importResume.js';
import jobs from '../models/jobModel.js';
import {
  extractMatchingRoleFromResume,
  extractSkillsFromResume,
} from '../services/applicantService.js';
import fs from 'fs';
import {
  fetchJobsById,
  updateJobApplicantionStatus,
} from '../services/jobService.js';
import { applicantEnum, Enum } from '../utils/enum.js';

export const scoreResume = async (req, res) => {
  try {
    if (!req.files || (!req.files.resume && !req.files.jobDescriptionFile)) {
      logger.warn(Message.UPLOAD_FAILED);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'No resume or job description file uploaded'
      );
    }

    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jobDescriptionFile?.[0];
    const jdText = req.body.jobDescription;

    const result = await processResumeAndJD(resumeFile, jdFile, jdText);

    if (resumeFile) fs.unlinkSync(resumeFile.path);
    if (jdFile) fs.unlinkSync(jdFile.path);

    logger.info(`${Message.RESUME_SCORED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `${Message.RESUME_SCORED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO}process resume scoring. ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO}process resume scoring.`
    );
  }
};

export const addJobApplication = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      logger.warn(Message.UPLOAD_FAILED);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `${Message.UPLOAD_FAILED}`
      );
    }

    const { job_id } = req.body;
    const resumeFile = req.files.resume?.[0];

    const job = await jobs.findOne({ job_id });

    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    const jdText = `jobsubject: ${
      job.job_subject
    }, jobdetails: ${job.job_details.replace(/<[^>]*>/g, '')}, jobtype: ${
      job.job_type
    }, job location: ${job.job_location}, ${job.job_type}, min experience: ${
      job.min_experience
    }, contractduration: ${job.contract_duration}, ${
      job.required_skills
    }, work preference :${job.work_preference}`;

    let resumeText;
    try {
      switch (resumeFile.mimetype) {
        case 'application/pdf':
          resumeText = await extractTextFromPDF(resumeFile.path);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          resumeText = await extractTextFromDocx(resumeFile.path);
          break;
        case 'application/msword':
          resumeText = await extractTextFromDoc(resumeFile.path);
          break;
        default:
          return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            Message.UNSUPPORTED_FILE
          );
      }
    } catch (extractError) {
      logger.error('Error extracting text:', extractError);
      throw new Error('Failed to extract text from resume');
    }

    const applicantData = parseResumeText(resumeText);
    if (!applicantData.email || !applicantData.phone.phoneNumber) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Could not extract email or phone from resume'
      );
    }

    const matchedSkills = await extractSkillsFromResume(resumeText);
    const role = await extractMatchingRoleFromResume(resumeText);

    const existingApplicant = await Applicant.findOne({
      $or: [
        { email: applicantData.email },
        { 'phone.phoneNumber': applicantData.phone.phoneNumber },
      ],
    });

    const applicant =
      existingApplicant ||
      new Applicant({
        ...applicantData,
        otherSkills: matchedSkills,
        appliedRole: role,
        isActive: true,
        resumeUrl: '',
        addedBy: applicantEnum.GUEST,
      });

    if (!existingApplicant) {
      await applicant.save();
    }

    let application = await jobApplication.findOne({
      applicant_Id: applicant._id,
    });

    if (!application) {
      application = new jobApplication({
        applicant_Id: applicant._id,
        applications: [
          {
            job_id: job._id,
            score: calculateJobScore(resumeText, jdText),
            appliedDate: new Date(),
          },
        ],
        user_id: req.user.id,
      });
    } else {
      const existingAppIndex = application.applications.findIndex(
        (app) => app.job_id.toString() === job._id.toString()
      );

      if (existingAppIndex >= 0) {
        application.applications[existingAppIndex] = {
          ...application.applications[existingAppIndex],
          job_id: job._id,
          score: calculateJobScore(resumeText, jdText),
          appliedDate: new Date(),
        };
      } else {
        application.applications.push({
          job_id: job._id,
          score: calculateJobScore(resumeText, jdText),
          appliedDate: new Date(),
        });
      }
    }

    if (resumeFile) fs.unlinkSync(resumeFile.path);
    await application.save();

    logger.info(`Application ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Application ${Message.ADDED_SUCCESSFULLY}`,
      {
        applicant_Id: applicant._id,
        applicationId: application._id,
        score: calculateJobScore(resumeText, jdText),
      }
    );
  } catch (error) {
    console.log('from catch block>>>>>>>>>>>>>', error);
    logger.error(`${Message.FAILED_TO} add application.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add application.`
    );
  }
};

export const updateApplicantionStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const result = await updateJobApplicantionStatus(applicationId, status);

    if (result.modifiedCount === 0) {
      logger.warn(`Application ${Message.NOT_FOUND} with ID: ${applicationId}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Application ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Application status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Application status ${Message.UPDATED_SUCCESSFULLY}`,
      {
        applicationId,
        newStatus: status,
      }
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} update application status: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update application status`
    );
  }
};

export const fetchAppliedJobs = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }
    const applications = await fetchJobsById(userId);

    if (!applications || applications.length === 0) {
      logger.error(`Applied jobs for this user ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applied jobs for this user ${Message.NOT_FOUND}`
      );
    }

    const formatted = applications.map(app => {
      const newApps = app.applications.map(item => {
        const job = item.job_id;
        return {
          job_id: job?.job_id,     
          _id: job?._id,            
          job_subject: job?.job_subject || '',
          score: item.score,
          status: item.status,
          applied_Date: item.applied_Date
        };
      });

      return {
        _id: app._id,
        applicant_Id: app.applicant_Id,
        user_id: app.user_id,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        applications: newApps
      };
    });

    logger.info(`All jobs applications ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All jobs applications ${Message.FETCH_SUCCESSFULLY}`,
      formatted
    );
  } catch (error) {
    logger.error(`Failed to fetch applied job IDs: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applied job IDs.`
    );
  }
};
