import mongoose from 'mongoose';
import logger from '../loggers/logger.js'
import jobs from '../models/jobModel.js'

export const createJobService = async (jobData) => {
    try {
        return await jobs.create(jobData)
    } catch (error) {
        logger.error('Error while creating job', error);
        throw error;
    }
}

export const fetchJobService = async (jobId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
        return await jobs.findOne({ _id: jobId })
    } catch (error) {
        logger.error('Error while fetch job', error);
        throw error;
    }
}

export const updateJobService = async (id, body) => {
    try {
        return jobs.updateOne({ _id: id }, { $set: body })
    } catch (error) {
        logger.error('Error while update job', error);
        throw error;
    }
}

export const deletJobService = async (ids) => {
    try {
        return await jobs.deleteMany({ _id: { $in: ids } });
    } catch (error) {
        logger.error('Error while delete jobs', error);
        throw error;
    }
};

export const fetchJobsByVendorService = async (vendorId) => {
    try {
        return await jobs.find({ addedBy: vendorId });
    } catch (error) {
        logger.error('Error while fetching jobs by vendor', error);
        throw error;
    }
};