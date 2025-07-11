import mongoose from 'mongoose';
import logger from '../loggers/logger.js'
import jobs from '../models/jobModel.js'
import jobApplication from '../models/jobApplicantionModel.js';
import Vendor from '../models/vendorModel.js';

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

export const fetchJobsById = async (userId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await jobApplication.find({ user_id: userId }).populate({
            path: 'applications.job_id',
            model: 'jobs',
            select:
                'job_subject job_id',
        }).sort({ applied_Date: -1 });
    } catch (error) {
        logger.error('Error while fetch job', error);
        throw error;
    }
};

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

export const updateJobApplicantionStatus = async (applicationId, status) => {
    try {
        const applicationObjectId = new mongoose.Types.ObjectId(applicationId);
        return await jobApplication.updateOne({
            "applications._id": applicationObjectId
        },
            {
                $set: {
                    "applications.$.status": status
                }
            });
    } catch (error) {
        logger.error('Error while updating job application status', error);
        throw error;
    }
};

export const createVendorData = async (userId, data = {}) => {
    try {
        const {
            whatsapp_number,
            vendor_linkedin_profile,
            company_name,
            company_email,
            company_phone_number,
            company_location,
            company_type,
            hire_resources,
            company_strength,
            company_time,
            company_linkedin_profile,
            company_website
        } = data;

        const vendorData = {
            userId,
            whatsapp_number,
            vendor_linkedin_profile,
            company_name,
            company_email,
            company_phone_number,
            company_location,
            company_type,
            hire_resources,
            company_strength,
            company_time,
            company_linkedin_profile,
            company_website
        };

        Object.keys(vendorData).forEach(
            key => (vendorData[key] === undefined || vendorData[key] === null) && delete vendorData[key]
        );

        return await Vendor.create(vendorData);
    } catch (error) {
        logger.error('Error while creating vendor profile', error);
        throw error;
    }
}

export const findVendorByUserId = async (query) => {
    try {
        return await Vendor.findOne(query)
    } catch (error) {
        logger.error("Error while find vendor by userId", error)
        throw error;
    }
}

export const updateVendorData = async (userId, updatedData) => {
    try {
        const result = await Vendor.updateOne(
            { userId },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            logger.warn(`No vendor data was updated for userId: ${userId}`);
        }

        return result;
    } catch (error) {
        logger.error('Error while updating vendor data', error);
        throw new Error('Failed to update vendor data');
    }
} 