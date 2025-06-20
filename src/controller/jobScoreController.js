import {
  calculateJobScore,
  processResumeAndJD,
} from '../services/jobScoreService.js';
import { StatusCodes } from 'http-status-codes';
import Applicant from '../models/applicantModel.js';
import jobApplication from '../models/jobApplicantionModel.js';
import logger from '../loggers/logger.js';
import { jobScoreResume } from '../helpers/multer.js';
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

export const scoreResume = (req, res) => {
  jobScoreResume(req, res, async (err) => {
    try {
      if (err) {
        logger.error(`${Message.FAILED_TO} upload resume: ${err.message}`);
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          err.message.includes('File type')
            ? Message.INVALID_FILE_TYPE
            : err.message
        );
      }
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

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Resume scored successfully',
        result
      );
    } catch (error) {
      logger.error(`Resume scoring failed: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Resume scoring failed'
      );
    }
  });
};

// export const addJobApplication = async (req, res) => {
//   try {
//     jobScoreResume(req, res, async (err) => {
//         if (err) {
//           logger.error(`${Message.FAILED_TO} upload resume: ${err.message}`);
//           return HandleResponse(
//             res,
//             false,
//             StatusCodes.BAD_REQUEST,
//             err.message.includes('File type')
//               ? Message.INVALID_FILE_TYPE
//               : err.message
//           );
//         }

//         if (!req.files || req.files.length === 0) {a
//           logger.warn('No files Uploaded');
//           return HandleResponse(
//             res,
//             false,
//             StatusCodes.BAD_REQUEST,
//             'No files Uploaded'
//           );
//         }
//     const { job_id } = req.body; // Get job ID from request
//      // Uploaded resume file

//     console.log("job_id",job_id)

//     // const jdtext = jobs.findOne({ job_id: jobId });
//      const jdText = await jobs.findOne({ job_id });
//     console.log("JDtext>>>>>>>",jdText.job_details)

//     // 1. Extract text from resume
//     let resumeText;
//     if (resumeFile.mimetype === 'application/pdf') {
//       resumeText = await extractTextFromPDF(resumeFile.path);
//     } else if (resumeFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//       resumeText = await extractTextFromDocx(resumeFile.path);
//     } else if (resumeFile.mimetype === 'application/msword') {
//       resumeText = await extractTextFromDoc(resumeFile.path);
//     }

//     console.log("resumetexttt",resumeText)

//     // 2. Parse resume text to get applicant info
//     const applicantData = parseResumeText(resumeText);

//     // 3. Find or create applicant
//     let applicant = await Applicant.findOne({
//       $or: [
//         { email: applicantData.email },
//         { 'phone.phoneNumber': applicantData.phone.phoneNumber }
//       ]
//     });

//     if (!applicant) {
//       // Create new applicant if not found
//       applicant = new Applicant({
//         ...applicantData,
//         addedBy: 'resume'
//       });
//       await applicant.save();
//     }

//     // 4. Handle job application
//     let application = await jobApplication.findOne({ applicant_Id: applicant._id });

//     if (!application) {
//       // Create new application record if doesn't exist
//       application = new jobApplication({
//         applicant_Id: applicant._id,
//         applications: [{
//           job_id,
//           score: calculateJobScore(resumeText, jdtext) // Implement your scoring logic
//         }]
//       });
//     } else {
//       // Check if already applied to this job
//       const existingApplication = application.applications.find(app => app.job_id.equals(job_id));

//       if (existingApplication) {
//         // Update existing application
//         existingApplication.appliedDate = new Date();
//         existingApplication.score = calculateJobScore(resumeText, jdText.job_details);
//       } else {
//         // Add new application to array
//         application.applications.push({
//           job_id,
//           score: calculateJobScore(resumeText, jdText.job_details)
//         });
//       }
//     }

//     await application.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Application processed successfully',
//       data: {
//         applicant_Id: applicant._id,
//         applicationId: application._id
//       }
//     });

//     })} catch (error) {
//     console.error('Error processing application:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to process application',
//       error: error.message
//     });
//   }
// }

export const addJobApplication = async (req, res) => {
  try {
    jobScoreResume(req, res, async (err) => {
      try {
        if (err) {
          logger.error(`${Message.FAILED_TO} upload resume: ${err.message}`);
          return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            err.message.includes('File type')
              ? Message.INVALID_FILE_TYPE
              : err.message
          );
        }

        if (!req.files || req.files.length === 0) {
          logger.warn('No files Uploaded');
          return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            'No files Uploaded'
          );
        }

        const { job_id } = req.body;
        const resumeFile = req.files.resume?.[0];

        if (!resumeFile) {
          return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            'Resume file is required'
          );
        }

        const job = await jobs.findOne({ job_id });
        const jdText = `jobsubject: ${
          job.job_subject
        }, jobdetails: ${job.job_details.replace(/<[^>]*>/g, '')}, jobtype: ${
          job.job_type
        }, job location: ${job.job_location}, ${job.job_type}, min experience: ${
          job.min_experience
        }, contractduration: ${job.contract_duration}, ${job.required_skills}, work preference :${job.work_preference}`;
        console.log(">>>>>>>>>>>",jdText)
        if (!job) {
          return HandleResponse(
            res,
            false,
            StatusCodes.NOT_FOUND,
            'Job not found'
          );
        }

        let resumeText;
        try {
          if (resumeFile.mimetype === 'application/pdf') {
            resumeText = await extractTextFromPDF(resumeFile.path);
          } else if (
            resumeFile.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            resumeText = await extractTextFromDocx(resumeFile.path);
          } else if (resumeFile.mimetype === 'application/msword') {
            resumeText = await extractTextFromDoc(resumeFile.path);
          } else {
            return HandleResponse(
              res,
              false,
              StatusCodes.BAD_REQUEST,
              'Unsupported file type'
            );
          }
        } catch (extractError) {
          logger.error('Error extracting text:', extractError);
          throw new Error('Failed to extract text from resume');
        }

        console.log("OPLLLLLL",resumeText)

        const applicantData = parseResumeText(resumeText);
        if (!applicantData.email || !applicantData.phone.phoneNumber) {
          throw new Error(
            'Failed to extract required applicant info from resume'
          );
        }

        const matchedSkills = await extractSkillsFromResume(resumeText);
        const role = await extractMatchingRoleFromResume(resumeText);

        let applicant = await Applicant.findOne({
          $or: [
            { email: applicantData.email },
            { 'phone.phoneNumber': applicantData.phone.phoneNumber },
          ],
        });

        if (!applicant) {
          applicant = new Applicant({
            ...applicantData,
            otherSkills: matchedSkills,
            appliedRole: role,
            isActive: true,
            resumeUrl: ``,
            addedBy: 'Resume',
          });
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
                score: calculateJobScore(resumeText, job.job_details),
                appliedDate: new Date(),
              },
            ],
          });
        } else {
          const existingAppIndex = application.applications.findIndex(
            (app) => app.job_id.toString() === job_id.toString()
          );

          if (existingAppIndex >= 0) {
            application.applications[existingAppIndex].applied_Date =
              new Date();
            application.applications[existingAppIndex].score =
              calculateJobScore(resumeText, jdText);
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

        return HandleResponse(
          res,
          true,
          StatusCodes.OK,
          'Application processed successfully',
          {
            applicant_Id: applicant._id,
            applicationId: application._id,
            score: calculateJobScore(resumeText, jdText),
          }
        );
      } catch (innerError) {
       logger.error(`${Message.FAILED_TO} process application,`,innerError);
        return HandleResponse(
          res,
          false,
          StatusCodes.INTERNAL_SERVER_ERROR,
          `${Message.FAILED_TO } process application`,
        );
      }
    });
  } catch (outerError) {
   logger.error(`${Message.FAILED_TO} add aplicant.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add aplicant.${error}`
    );
  }
};
