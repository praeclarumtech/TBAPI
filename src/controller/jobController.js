import { StatusCodes } from 'http-status-codes'
import { HandleResponse } from '../helpers/handleResponse.js'
import { createJobService, deletJobService, fetchJobService, updateJobService } from '../services/jobService.js'
import { Message } from '../utils/constant/message.js'
import logger from '../loggers/logger.js'
import { pagination } from '../helpers/commonFunction/handlePagination.js'
import jobs from '../models/jobModel.js'
import { generateJobId } from '../helpers/generateApplicationNo.js'

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
        const { subject, page = 1, limit = 10 } = req.query
        const query = {}
        if (subject) {
            query.subject = { $regex: subject, $options: 'i' }
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
        return HandleResponse(res, true, StatusCodes.ACCEPTED, `Job is ${Message.UPDATED_SUCCESSFULLY}`, updateJob)
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

