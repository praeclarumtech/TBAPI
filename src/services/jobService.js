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

export const fetchJobsById = async (userId, page = 1, limit = 10) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const skip = (page - 1) * limit;
    const totalCount = await jobApplication.countDocuments({ user_id: userId });

    const applications = await jobApplication
      .find({ user_id: userId })
      .select('score job_id status')
      .populate({
        path: 'job_id',
        model: 'jobs',
        select: 'job_subject job_id',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const transformed = applications.map((app) => ({
      _id: app._id,
      status: app.status,
      job_id: app.job_id?._id || null,
      job_subject: app.job_id?.job_subject || null,
      score: app.score,
    }));

    return {
      applications: transformed,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
      }
    }
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
    return await jobs.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true } }
    )
  } catch (error) {
    logger.error('Error while delete jobs', error);
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
export const getJobApplicationsByvendor = async (vendorId, page = 1, limit = 50) => {
  try {
    const skip = (page - 1) * limit;

    const totalCount = await jobApplication.countDocuments({
      vendor_id: vendorId
    });

    const applications = await jobApplication
      .find({ vendor_id: vendorId })
      .populate({
        path: 'job_id',
        model: 'jobs',
        select: 'job_id job_subject',
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      applications,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
      },
    };
  } catch (error) {
    logger.error('Error while fetch Job applicantions', error);
    throw error;
  }
};

export const getApplicantionById = async (applicationId) => {
  try {
    const applicant = await jobApplication.findById(applicationId).populate({
      path: 'job_id',
      model: 'jobs',
      select: 'job_id job_subject',
    })
    return applicant
  } catch (error) {
    logger.error('Error while fetch Job applicantions by id', error);
    throw error;
  }
}

export const deleteApplications = async (ids) => {
  try {
    return await jobApplication.deleteMany({ _id: { $in: ids } })
  } catch (error) {
    logger.error('Error while deleting applications', error);
    throw error;
  }
}

export const updateStatusAndInterviewstage = async (applicantId, updateData) => {
  try {
    return await jobApplication.updateOne({ _id: applicantId }, { $set: updateData })
  } catch (error) {
    logger.error('Error while updating status and interview stage', error);
    throw error;
  }
}
