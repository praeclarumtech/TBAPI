import { StatusCodes } from 'http-status-codes'
import { HandleResponse } from '../helpers/handleResponse.js'
import { createJobService, deletJobService, fetchJobService, updateJobService } from '../services/jobService.js'
import { Message } from '../utils/constant/message.js'
import logger from '../loggers/logger.js'
import { pagination } from '../helpers/commonFunction/handlePagination.js'
import jobs from '../models/jobModel.js'
import { generateApplicantNo, generateJobId } from '../helpers/generateApplicationNo.js'
import { applicantEnum } from '../utils/enum.js'

export const createJob = async (req, res) => {
    try {
        const job_id = await generateJobId()
        const jobData = { job_id, ...req.body }
        await createJobService(jobData)
        logger.info(`New job ${Message.ADDED_SUCCESSFULLY}`)
        return HandleResponse(res, true, StatusCodes.CREATED, `New job ${Message.ADDED_SUCCESSFULLY}`)
    } catch (error) {
        logger.error(`${Message.FAILED_TO} add job`, error)
        return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} add job`)
    }
}

export const viewJobs = async (req, res) => {
    try {
        const { job_subject, job_type, page = 1, limit = 10 } = req.query
        const query = {}
        if (job_subject) {
            query.job_subject = { $regex: job_subject, $options: 'i' }
        }
        if (job_type) {
            const cleanType = job_type.replace(/[^a-zA-Z0-9]/g, '');
            const flexiblePattern = cleanType.split('').join('[-_\\s]*')
            query.job_type = { $regex: flexiblePattern, $options: 'i' }
        }
        const result = await pagination({
            Schema: jobs,
            page: parseInt(page),
            limit: parseInt(limit),
            query,
            sort: { createdAt: -1 },
        });
        if (!result || result?.length === 0) {
            logger.error(`jobs ${Message.NOT_FOUND}`)
            return HandleResponse(res, false, StatusCodes.NOT_FOUND, `jobs ${Message.NOT_FOUND}`)
        }
        logger.info(`All jobs ${Message.FETCH_SUCCESSFULLY}`)
        return HandleResponse(res, true, StatusCodes.OK, `All jobs ${Message.FETCH_SUCCESSFULLY}`, result)
    } catch (error) {
        console.log(error)
        logger.error(`${Message.FAILED_TO} fetch job`)
        return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} fetchjob`)
    }
}

export const viewJobDetails = async (req, res) => {
    try {
        const jobId = req.params.id
        const result = await fetchJobService(jobId)
        if (!result) {
            logger.error(`job is  ${Message.NOT_FOUND}`)
            return HandleResponse(res, false, StatusCodes.NOT_FOUND, `job is ${Message.NOT_FOUND}`)
        }
        logger.info(`job is ${Message.FETCH_SUCCESSFULLY}`)
        return HandleResponse(res, true, StatusCodes.OK, `job is ${Message.FETCH_SUCCESSFULLY}`, result)
    } catch (error) {
        logger.error(`${Message.FAILED_TO} fetch job`)
        return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} fetch job`)
    }
}


export const updateJob = async (req, res) => {
    try {
        const jobId = req.params.id
        const existJob = await fetchJobService(jobId)
        if (!existJob) {
            logger.error(`job is  ${Message.NOT_FOUND}`)
            return HandleResponse(res, false, StatusCodes.NOT_FOUND, `job is ${Message.NOT_FOUND}`)
        }
        const updateData = { ...req.body }
        const updateJob = await updateJobService(jobId, updateData)
        logger.info(`Job is ${Message.UPDATED_SUCCESSFULLY}`)
        return HandleResponse(res, true, StatusCodes.OK, `Job is ${Message.UPDATED_SUCCESSFULLY}`, updateJob)
    } catch (error) {
        logger.error(`${Message.FAILED_TO} fetch job`)
        return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} update job`)
    }
}

export const deleteJob = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            logger.error(`ObjectId is ${Message.NOT_FOUND}`);
            return HandleResponse(res, false, StatusCodes.BAD_REQUEST, `ObjectId is ${Message.NOT_FOUND}`);
        }
        const removeJob = await deletJobService(ids)
        if (removeJob.deletedCount === 0) {
            logger.error(`Job is ${Message.NOT_FOUND}`);
            return HandleResponse(res, false, StatusCodes.NOT_FOUND, `Job is ${Message.NOT_FOUND}`);
        }
        const message = removeJob.deletedCount > 1 ? `${removeJob.deletedCount} Jobs are ${Message.DELETED_SUCCESSFULLY}` : `${removeJob.deletedCount} Jobs is ${Message.DELETED_SUCCESSFULLY}`
        logger.info(message);
        return HandleResponse(res, true, StatusCodes.OK, message, removeJob);
    } catch (error) {
        logger.error(`${Message.FAILED_TO} delete jobs.`);
        return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} delete jobs.`);
    }
}

export const addApplicantByJob = async(req,res)=>{
    try {
    const {
      name: { firstName, middleName, lastName },
      appliedRole,
      meta,
      email_to,
      ...body
    } = req.body;

    let id = null;
    if (req?.user) {
      const request = req?.user;
      id = request.id;
    }
    const applicationNo = await generateApplicantNo();

    
    const applicantData = {
      applicationNo,
      name: { firstName, middleName, lastName },
      user_id: id,
      addedBy: applicantEnum.MANUAL,
      appliedRole,
      isActive: true,
      meta: meta || {},
      ...body,
    };

    const applicant = await createApplicant(applicantData);
    
    const resumeFile = req.files || [];

    if (resumeFile.length > 0) {
      const attachments = resumeFile.map((file) => ({
        filename: file.originalname || file.filename,
        path: path.join(file.destination, file.filename),
      }));

      const emailData = {
        email_to: [process.env.HR_EMAIL],
        subject: `New Applicant Resume Received from QR Code Form – ${req.body.name.firstName} ${req.body.name.lastName}`,
        description: `
           <p>The applicant <strong>${req.body.name.firstName} ${req.body.name.lastName}</strong> has submitted their resume via the QR Code form for the position of <strong>${req.body.appliedRole}</strong>.</p>
           <p>Please find the attached resume for your review.</p>
        `,
        attachments,
      };

      sendingEmail(emailData)
        .then((result) => {
          logger.info('Resume email sent successfully');
        })
        .catch((error) => {
          logger.error('Failed to send resume email:', error);
        });
    }

    logger.info(`Applicant ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Applicant ${Message.ADDED_SUCCESSFULLY}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add aplicant.`, error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = Object.values(error.keyValue)[0];
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${duplicateField} ${duplicateValue} is already in use please use a different number.`
      );
    } else {
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${Message.FAILED_TO} add aplicant.${error}`
      );
    }
  }
}

