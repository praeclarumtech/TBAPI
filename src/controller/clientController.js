import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { HandleResponse } from '../helpers/handleResponse.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { Enum, applicantEnum } from '../utils/enum.js';
import jobApplication from '../models/jobApplicantionModel.js';
import { fetchJobService } from '../services/jobService.js';
import { updateStatusAndInterviewstage } from '../services/jobService.js';
import jobs from '../models/jobModel.js';

// Shortlist Applicant
export const shortlistApplicant = async (req, res) => {
  try {
    const user = req.user;
    const { applicationId } = req.params;
    const { feedback, comment } = req.body;

    if (user.role !== Enum.CLIENT) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients can shortlist applicants'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid application ID'
      );
    }

    // Get application and verify it belongs to client's job
    const application = await jobApplication
      .findById(applicationId)
      .populate('job_id');
    if (!application) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Application ${Message.NOT_FOUND}`
      );
    }

    const job = await fetchJobService(
      application.job_id._id || application.job_id
    );
    if (!job || job.addedBy.toString() !== user.id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'You can only shortlist applicants for your own jobs'
      );
    }

    // Update application status to shortlisted
    await updateStatusAndInterviewstage(applicationId, {
      status: applicantEnum.SHORTLISTED,
      feedback: feedback || application.feedback,
      comment: comment || application.comment,
      lastFollowUpDate: new Date(),
    });

    const updatedApplication = await jobApplication.findById(applicationId);

    logger.info(`Applicant ${applicationId} shortlisted by client`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Applicant shortlisted successfully',
      updatedApplication
    );
  } catch (error) {
    logger.error(`Failed to shortlist applicant: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to shortlist applicant'
    );
  }
};

// Reject Applicant
export const rejectApplicant = async (req, res) => {
  try {
    const user = req.user;
    const { applicationId } = req.params;
    const { feedback, comment } = req.body;

    if (user.role !== Enum.CLIENT) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients can reject applicants'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid application ID'
      );
    }

    const application = await jobApplication
      .findById(applicationId)
      .populate('job_id');
    if (!application) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Application ${Message.NOT_FOUND}`
      );
    }

    const job = await fetchJobService(
      application.job_id._id || application.job_id
    );
    if (!job || job.addedBy.toString() !== user.id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'You can only reject applicants for your own jobs'
      );
    }

    await updateStatusAndInterviewstage(applicationId, {
      status: applicantEnum.REJECTED,
      feedback: feedback || application.feedback,
      comment: comment || application.comment,
      lastFollowUpDate: new Date(),
    });

    const updatedApplication = await jobApplication.findById(applicationId);

    logger.info(`Applicant ${applicationId} rejected by client`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Applicant rejected successfully',
      updatedApplication
    );
  } catch (error) {
    logger.error(`Failed to reject applicant: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to reject applicant'
    );
  }
};

// Hire/Select Applicant (Finalize Applicant)
export const hireApplicant = async (req, res) => {
  try {
    const user = req.user;
    const { applicationId } = req.params;
    const { feedback, comment, interviewStage } = req.body;

    if (user.role !== Enum.CLIENT) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients can hire applicants'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid application ID'
      );
    }

    const application = await jobApplication
      .findById(applicationId)
      .populate('job_id');
    if (!application) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Application ${Message.NOT_FOUND}`
      );
    }

    const job = await fetchJobService(
      application.job_id._id || application.job_id
    );
    if (!job || job.addedBy.toString() !== user.id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'You can only hire applicants for your own jobs'
      );
    }

    // Update to selected status
    await updateStatusAndInterviewstage(applicationId, {
      status: applicantEnum.SELECTED,
      interviewStage: interviewStage || applicantEnum.CLIENT,
      feedback: feedback || application.feedback,
      comment: comment || application.comment,
      lastFollowUpDate: new Date(),
    });

    const updatedApplication = await jobApplication.findById(applicationId);

    logger.info(`Applicant ${applicationId} hired by client`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Applicant hired successfully',
      updatedApplication
    );
  } catch (error) {
    logger.error(`Failed to hire applicant: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to hire applicant'
    );
  }
};

// Negotiate with Applicant (Add negotiation terms)
export const negotiateWithApplicant = async (req, res) => {
  try {
    const user = req.user;
    const { applicationId } = req.params;
    const { negotiation, expectedPkg, noticePeriod, feedback } = req.body;

    if (user.role !== Enum.CLIENT) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients can negotiate with applicants'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid application ID'
      );
    }

    const application = await jobApplication
      .findById(applicationId)
      .populate('job_id');
    if (!application) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Application ${Message.NOT_FOUND}`
      );
    }

    const job = await fetchJobService(
      application.job_id._id || application.job_id
    );
    if (!job || job.addedBy.toString() !== user.id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'You can only negotiate with applicants for your own jobs'
      );
    }

    const updateData = {
      negotiation: negotiation || application.negotiation,
      lastFollowUpDate: new Date(),
    };

    if (expectedPkg !== undefined) updateData.expectedPkg = expectedPkg;
    if (noticePeriod !== undefined) updateData.noticePeriod = noticePeriod;
    if (feedback) updateData.feedback = feedback;

    await updateStatusAndInterviewstage(applicationId, updateData);

    const updatedApplication = await jobApplication.findById(applicationId);

    logger.info(`Negotiation updated for applicant ${applicationId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Negotiation terms updated successfully',
      updatedApplication
    );
  } catch (error) {
    logger.error(`Failed to negotiate with applicant: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update negotiation'
    );
  }
};

// Get Client Dashboard Summary
export const getClientDashboard = async (req, res) => {
  try {
    const user = req.user;
    const { jobId } = req.query;

    if (user.role !== Enum.CLIENT) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients can view dashboard'
      );
    }

    let jobFilter = { addedBy: user.id, isDeleted: false };
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      jobFilter._id = jobId;
    }

    // Get jobs stats
    const totalJobs = await jobs.countDocuments(jobFilter);
    const activeJobs = await jobs.countDocuments({
      ...jobFilter,
      isActive: true,
    });

    // Get job IDs for filtering applications
    const clientJobs = await jobs.find(jobFilter, '_id').lean();
    const jobIds = clientJobs.map((job) => job._id);

    // Get applicants stats
    const totalApplicants = await jobApplication.countDocuments({
      job_id: { $in: jobIds },
      isDeleted: false,
    });

    const applicantsByStatus = await jobApplication.aggregate([
      {
        $match: {
          job_id: { $in: jobIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const applicantsStatusMap = {};
    applicantsByStatus.forEach((item) => {
      applicantsStatusMap[item._id] = item.count;
    });

    const dashboardData = {
      jobs: {
        total: totalJobs,
        active: activeJobs,
        inactive: totalJobs - activeJobs,
      },
      applicants: {
        total: totalApplicants,
        byStatus: {
          applied: applicantsStatusMap[applicantEnum.APPLIED] || 0,
          shortlisted: applicantsStatusMap[applicantEnum.SHORTLISTED] || 0,
          selected: applicantsStatusMap[applicantEnum.SELECTED] || 0,
          rejected: applicantsStatusMap[applicantEnum.REJECTED] || 0,
          inProgress: applicantsStatusMap[applicantEnum.IN_PROGRESS] || 0,
          onHold: applicantsStatusMap[applicantEnum.ON_HOLD] || 0,
        },
      },
    };

    logger.info(`Client dashboard data ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Dashboard data ${Message.FETCH_SUCCESSFULLY}`,
      dashboardData
    );
  } catch (error) {
    logger.error(`Failed to fetch client dashboard: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch dashboard data'
    );
  }
};
