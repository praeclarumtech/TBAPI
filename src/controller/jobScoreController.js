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
  deleteApplications,
  fetchJobsById,
  getApplicantionById,
  getJobApplicationsByvendor,
  updateJobApplicantionStatus,
  updateStatusAndInterviewstage,
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

    const jdText = `jobsubject: ${job.job_subject
      }, jobdetails: ${job.job_details.replace(/<[^>]*>/g, '')}, jobtype: ${job.job_type
      }, job location: ${job.job_location}, ${job.job_type}, min experience: ${job.min_experience
      }, contractduration: ${job.contract_duration}, ${job.required_skills
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

    const existingApplicant = await jobApplication.findOne({
      $or: [
        { email: applicantData.email },
        { 'phone.phoneNumber': applicantData.phone.phoneNumber },
      ],
      job_id: job._id,
    });

    if (existingApplicant) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'Applicant already applied for this job.'
      );
    }

    const applicant = new jobApplication({
      ...applicantData,
      job_id: job._id,
      vendor_id: job.addedBy,
      otherSkills: matchedSkills,
      appliedRole: role,
      isActive: true,
      resumeUrl: '',
      addedBy: applicantEnum.GUEST,
      user_id: req.user?.id,
      score: calculateJobScore(resumeText, jdText),
    });

    if (resumeFile) fs.unlinkSync(resumeFile.path);
    await applicant.save();

    logger.info(`Application ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Application ${Message.ADDED_SUCCESSFULLY}`,
      {
        applicant,
      }
    );
  } catch (error) {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { applications, pagination } = await fetchJobsById(
      userId,
      page,
      limit
    );

    if (!applications || applications.length === 0) {
      logger.error(`Applied jobs for this user ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applied jobs for this user ${Message.NOT_FOUND}`
      );
    }

    logger.info(`All jobs applications ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All jobs applications ${Message.FETCH_SUCCESSFULLY}`,
      { applications, pagination }
    );
  } catch (error) {
    logger.error(`Failed to fetch applied job IDs: ${error.message}`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applied job IDs.`
    );
  }
};

export const viewJobApplicantionsByVendor = async (req, res) => {
  try {
    const user = req.user || {};
    const { appliedSkills } = req.query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };

    if (user.role === Enum.VENDOR) {
      query.vendor_id = user.id;
    }

    if (user.role === Enum.CLIENT) {
      const jobIds = await jobs.find({ addedBy: user.id }, { _id: 1 }).lean();
      const jobIdList = jobIds.map(job => job._id);
      query.job_id = { $in: jobIdList };
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills
        .split(',')
        .map(
          (skill) =>
            new RegExp(
              `^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            )
        );

      query.appliedSkills = { $all: skillsArray };
    }

    const totalCount = await jobApplication.countDocuments(query);

    const applications = await jobApplication
      .find(query)
      .populate({
        path: 'job_id',
        model: 'jobs',
        select: 'job_id job_subject addedBy',
        populate: {
          path: 'addedBy',
          model: 'user',
          select: 'firstName lastName role',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    logger.info(`Job applications ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job applications ${Message.FETCH_SUCCESSFULLY}`,
      {
        applications,
        pagination: {
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch applications.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applications.`
    );
  }
};

export const viewApplicantionsById = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    if (!applicationId) {
      logger.warn('Application ID not provided');
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Application ID is required'
      );
    }

    const applicant = await getApplicantionById(applicationId);

    if (!applicant) {
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Job application ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job applications ${Message.FETCH_SUCCESSFULLY}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch Job applicantion by id`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicantion by id.`
    );
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No applicant ID(s) provided' });
    }

    const deleteApplicant = await deleteApplications(ids, { isDeleted: true, });
    logger.info(`Applicantion ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicantion ${Message.DELETED_SUCCESSFULLY}`,
      deleteApplicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete applicantion.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete applicantion.`
    );
  }
};

export const updateApplicantStatus = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const { interviewStage, status } = req.body;

    const update = await updateStatusAndInterviewstage(applicantId, {
      interviewStage,
      status,
    });

    logger.info(`Applicant status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status ${Message.UPDATED_SUCCESSFULLY}`,
      update
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update applicant status.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant status.`
    );
  }
};

export const getVendorJobApplicantReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const result = await jobs.aggregate([
      {
        $group: {
          _id: '$addedBy',
          totalJobs: { $sum: 1 },
          jobIds: { $push: '$_id' },
          jobs: {
            $push: {
              job_id: '$_id',
              job_subject: '$job_subject',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'jobapplications',
          let: { jobIds: '$jobIds', vendorId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$job_id', '$$jobIds'] },
                    { $eq: ['$vendor_id', '$$vendorId'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$job_id',
                count: { $sum: 1 },
              },
            },
          ],
          as: 'applicantsPerJob',
        },
      },
      {
        $addFields: {
          totalApplicants: { $sum: '$applicantsPerJob.count' },
          jobs: {
            $map: {
              input: '$jobs',
              as: 'job',
              in: {
                $mergeObjects: [
                  '$$job',
                  {
                    applicantCount: {
                      $let: {
                        vars: {
                          matched: {
                            $first: {
                              $filter: {
                                input: '$applicantsPerJob',
                                as: 'a',
                                cond: { $eq: ['$$a._id', '$$job.job_id'] },
                              },
                            },
                          },
                        },
                        in: { $ifNull: ['$$matched.count', 0] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorDetails',
        },
      },
      { $unwind: { path: '$vendorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vendor_id: '$_id',
          vendorName: {
            $concat: [
              '$vendorDetails.firstName',
              ' ',
              '$vendorDetails.lastName',
            ],
          },
          // vendorName: "$vendorDetails.userName",
          totalJobs: 1,
          totalApplicants: 1,
          jobs: 1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const totalVendors = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalVendors / limit);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Vendor job-applicant report generated successfully',
      {
        totalVendors,
        totalPages,
        currentPage: page,
        data: result[0].data,
      }
    );
  } catch (error) {
    logger.error('Failed to generate vendor report', error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to generate vendor report'
    );
  }
};
