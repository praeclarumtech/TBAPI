import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { HandleResponse } from '../helpers/handleResponse.js';
import {
  createJobService,
  deletJobService,
  fetchJobService,
  findVendorByUserId,
  updateJobService,
} from '../services/jobService.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import jobs from '../models/jobModel.js';
import { generateJobId } from '../helpers/generateApplicationNo.js';
import { getAllusers, getUser } from '../services/userService.js';
import { getRoleByNameService } from '../services/roleService.js';
import { Enum } from '../utils/enum.js';
import User from '../models/userModel.js';
import { sendingEmail } from '../utils/email.js';
import {
  jobCreatedTemplate,
  jobNotificationTemplate,
} from '../utils/emailTemplates/emailTemplates.js';
import Applicant from '../models/applicantModel.js';
import {
  sendingEmail as sendingEmailHelper,
  generateQrEmailHtml,
} from '../helpers/commonFunction/handleEmail.js';
import jobApplication from '../models/jobApplicantionModel.js';
import { findApplicantByField } from '../services/applicantService.js';
import { applicantEnum } from '../utils/enum.js';
import { calculateJobScore } from '../services/jobScoreService.js';
import QRCode from 'qrcode';

// Helper function to send job notifications to matching applicants
const sendJobNotificationsToApplicants = async (jobData, jobId) => {
  let applicantEmailStatus = { sent: 0, failed: 0, errors: [] };

  try {
    const requiredSkills = jobData.required_skills || [];

    if (requiredSkills.length > 0 && Array.isArray(requiredSkills)) {
      // Normalize skills for case-insensitive matching
      const normalizedJobSkills = requiredSkills.map((skill) =>
        skill.trim().toLowerCase()
      );

      // Find applicants with matching skills
      const matchingApplicants = await Applicant.find({
        isDeleted: false,
        isActive: true,
        email: { $exists: true, $ne: '' },
        $or: [
          {
            appliedSkills: {
              $in: normalizedJobSkills.map(
                (skill) =>
                  new RegExp(
                    `^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    'i'
                  )
              ),
            },
          },
          {
            otherSkills: {
              $regex: normalizedJobSkills.join('|'),
              $options: 'i',
            },
          },
        ],
      }).limit(100); // Limit to prevent sending too many emails

      if (matchingApplicants.length > 0) {
        logger.info(
          `Found ${matchingApplicants.length} matching applicants for job ${jobId}`
        );

        // Get vendor/company name if available
        let companyName = '';
        if (jobData.addedBy) {
          const jobCreator = await User.findById(jobData.addedBy).populate(
            'roleId'
          );
          if (
            jobCreator &&
            (jobCreator.role === Enum.VENDOR || jobCreator.role === Enum.CLIENT)
          ) {
            const vendor = await findVendorByUserId({
              userId: jobData.addedBy,
            });
            companyName = vendor?.company_name || '';
          }
        }

        // Send email to each matching applicant
        const baseUrl = process.env.FRONT_URL || '';
        const jobIdForUrl = jobData._id || jobData._id?.toString();

        for (const applicant of matchingApplicants) {
          try {
            // Generate QR code for new job application flow
            const applicationUrl = `${baseUrl}vendor/email-check-apply?jobId=${jobIdForUrl}`;
            const qrCode = await QRCode.toDataURL(applicationUrl);
            const cid = `qr-job-${jobIdForUrl}@qr`;

            const qrCodeHtml = `
              <div style="text-align: center; margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
                  📱 Quick Apply with QR Code
                </h3>
                <p style="color: #555; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
                  Scan the QR code below to apply for this job instantly.<br/>
                  Or simply click it to open the application page on your device.
                </p>
                <div style="display: inline-block; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <a href="${applicationUrl}">
                    <img src="cid:${cid}" alt="QR Code" width="200" height="200" style="cursor: pointer; display: block; border-radius: 8px;" />
                  </a>
                </div>
                <p style="color: #666; font-size: 13px; margin: 15px 0 0 0;">
                  Click the QR code or use the button below to apply
                </p>
              </div>
            `;

            const inlineImage = {
              base64: qrCode,
              cid: cid,
            };

            const emailContent = jobNotificationTemplate({
              jobTitle: jobData.job_subject,
              jobSubject: jobData.job_subject,
              jobType: jobData.job_type,
              jobLocation: jobData.job_location,
              companyName: companyName,
              qrCodeHtml: qrCodeHtml,
              applicationUrl: applicationUrl,
            });

            await sendingEmailHelper({
              email_to: process.env.USER,
              subject: `New Job Opportunity: ${
                jobData.job_subject || 'Job Opening'
              }`,
              description: emailContent,
              inlineImages: [inlineImage],
              email: process.env.USER,
            });

            applicantEmailStatus.sent++;
            logger.info(
              `Job notification sent to applicant: ${applicant.email}`
            );
          } catch (emailErr) {
            applicantEmailStatus.failed++;
            applicantEmailStatus.errors.push({
              email: applicant.email,
              error: emailErr.message,
            });
            logger.error(
              `Failed to send job notification to ${applicant.email}:`,
              emailErr
            );
          }
        }
      } else {
        logger.info(`No matching applicants found for job ${jobId}`);
      }
    } else {
      logger.info(
        `Job ${jobId} has no required skills, skipping applicant matching`
      );
    }
  } catch (applicantErr) {
    logger.error(
      'Error finding/sending emails to matching applicants:',
      applicantErr
    );
    applicantEmailStatus.errors.push({
      general: applicantErr.message,
    });
  }

  return applicantEmailStatus;
};

export const createJob = async (req, res) => {
  try {
    const user = req.user.id;

    const userData = await User.findById(user).populate('roleId', 'name');

    if (userData.passwordChanged === false) {
      logger.warn(
        'User attempted to create job without changing temporary password'
      );
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Please change your password before creating a job. Your temporary password must be updated for security reasons.',
        { requiresPasswordChange: true }
      );
    }

    // ✅ Vendor/Client validation
    if (userData.role === Enum.VENDOR || userData.role === Enum.CLIENT) {
      const vendor = await findVendorByUserId({ userId: user });
      if (!vendor) {
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          `Vendor profile ${Message.NOT_FOUND}`
        );
      }
      const requiredFields = [
        'company_name',
        'company_email',
        'company_phone_number',
        'company_location',
        'company_type',
        'hire_resources',
        'company_strength',
        'company_website',
      ];
      const missingFields = requiredFields.filter((field) => !vendor[field]);
      if (missingFields.length > 0) {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          Message.IN_COMPLETE
        );
      }
    }

    // ✅ Job creation
    const job_id = await generateJobId();
    const applicationDeadline = new Date();
    applicationDeadline.setDate(applicationDeadline.getDate() + 30);
    const finalDate = applicationDeadline.toLocaleDateString('en-CA');

    const jobData = {
      job_id,
      addedBy: user,
      application_deadline: finalDate,
      ...req.body,
    };

    const createdJob = await createJobService(jobData);
    logger.info(`job ${Message.ADDED_SUCCESSFULLY}`);

    // ✅ Send Email to HR after job creation
    let emailStatus = {};
    try {
      const htmlBlock = jobCreatedTemplate({
        jobId: job_id,
        role: userData.roleId?.name || userData.role || 'N/A',
        jobTitle: req.body.job_subject,
        startDate: req.body.start_time,
        endDate: req.body.end_time,
        createdBy: `${userData.firstName} ${userData.lastName}`,
        createdAt: new Date().toLocaleString(),
      });

      emailStatus = await sendingEmail({
        email_to: [process.env.HR_EMAIL],
        subject: 'New Job Created',
        description: htmlBlock,
      });
    } catch (err) {
      logger.error('Email to HR failed:', err);
      emailStatus = { success: false, error: err.message };
    }

    // ✅ Response in Postman will include email status
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `job ${Message.ADDED_SUCCESSFULLY}`,
      {
        jobData,
        emailStatus,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add job`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add job`
    );
  }
};

export const viewJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      job_type,
      salary_currency,
      salary_frequency,
      min_salary,
      max_salary,
      min_experience,
      work_preference,
      required_skills,
      job_location,
      posted_by_role,
      filterBy,
    } = req.query;
    const query = { isDeleted: false };

    const user = req.user || {};
    if (posted_by_role) {
      const usersWithRole = await User.find(
        { role: posted_by_role },
        '_id'
      ).lean();

      const userIds = usersWithRole.map((u) => u._id);
      query.addedBy = { $in: userIds };
    } else if (user?.role === Enum.VENDOR) {
      query.addedBy = user.id;
    } else if (user?.role === Enum.CLIENT) {
      query.addedBy = user.id;
    }

    if (user.role === Enum.ADMIN && filterBy === Enum.VENDOR) {
      const vendorRole = await getRoleByNameService(Enum.VENDOR);
      const vendorUsers = await getAllusers(
        { roleId: vendorRole._id },
        { _id: 1 }
      );
      const vendorIds = vendorUsers.map((v) => v._id);
      query.addedBy = { $in: vendorIds };
    } else if (user.role === Enum.ADMIN && filterBy === Enum.CLIENT) {
      const clientRole = await getRoleByNameService(Enum.CLIENT);
      const clientUsers = await getAllusers(
        { roleId: clientRole._id },
        { _id: 1 }
      );
      const clientIds = clientUsers.map((v) => v._id);
      query.addedBy = { $in: clientIds };
    }

    if (search && typeof search === 'string') {
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '');
      const flexiblePattern = cleanSearch.split('').join('[-_\\s]*');
      const regex = new RegExp(flexiblePattern, 'i');
      query.$or = [
        { job_subject: { $regex: regex } },
        { job_type: { $regex: regex } },
      ];
    }

    if (job_type) {
      query.job_type = job_type;
    }

    if (salary_currency) {
      query.salary_currency = salary_currency;
    }

    if (salary_frequency) {
      query.salary_frequency = salary_frequency;
    }

    if (min_salary) {
      query.min_salary = { $lte: parseInt(min_salary) };
    }

    if (max_salary) {
      query.max_salary = { $lte: parseInt(max_salary) };
    }

    if (min_experience) {
      query.min_experience = { $gte: parseInt(min_experience) };
    }

    if (work_preference) {
      query.work_preference = work_preference;
    }

    if (job_location) {
      query.job_location = job_location;
    }

    if (required_skills) {
      const skillsArray = required_skills
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      if (skillsArray.length > 0) {
        const regexPatterns = skillsArray.map(
          (skill) =>
            new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        );
        query.required_skills = { $in: regexPatterns };
      }
    }

    const result = await pagination({
      Schema: jobs,
      page: parseInt(page),
      limit: parseInt(limit),
      query,
      sort: { createdAt: -1 },
    });
    if (!result || result?.length === 0) {
      logger.error(`Jobs ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Jobs ${Message.NOT_FOUND}`
      );
    }
    logger.info(`All jobs ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, undefined, result);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch job`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetchjob`
    );
  }
};

export const viewJobDetails = async (req, res) => {
  try {
    const jobId = req.params.id;
    const result = await fetchJobService(jobId);
    if (!result) {
      logger.error(`Job ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Job ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, undefined, result);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch job`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch job`
    );
  }
};

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const existJob = await fetchJobService(jobId);
    if (!existJob) {
      logger.error(`Job ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    // Check if job is being activated (isActive: false -> true)
    const isBeingActivated =
      existJob.isActive === false && req.body.isActive === true;

    await updateJobService(jobId, req.body);
    logger.info(`Job ${Message.UPDATED_SUCCESSFULLY}`);

    // ✅ Send emails to matching applicants when job is activated
    let applicantEmailStatus = { sent: 0, failed: 0, errors: [] };
    if (isBeingActivated) {
      logger.info(
        `Job ${jobId} is being activated, sending notifications to matching applicants`
      );

      // Get updated job data for email sending
      const updatedJob = await fetchJobService(jobId);
      applicantEmailStatus = await sendJobNotificationsToApplicants(
        updatedJob,
        updatedJob.job_id || jobId
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Job ${Message.UPDATED_SUCCESSFULLY}`,
      {
        applicantNotifications: isBeingActivated
          ? {
              sent: applicantEmailStatus.sent,
              failed: applicantEmailStatus.failed,
              errors:
                applicantEmailStatus.errors.length > 0
                  ? applicantEmailStatus.errors
                  : undefined,
            }
          : undefined,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update job`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update job`
    );
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.error(`Job ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Job ${Message.NOT_FOUND}`
      );
    }
    const removeJob = await deletJobService(ids);
    if (removeJob.modifiedCount === 0) {
      logger.error(`Job  ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }
    const message =
      removeJob.modifiedCount > 1
        ? `${removeJob.modifiedCount} jobs ${Message.DELETED_SUCCESSFULLY}`
        : `${removeJob.modifiedCount} Job ${Message.DELETED_SUCCESSFULLY}`;
    logger.info(message);
    return HandleResponse(res, true, StatusCodes.OK, message, removeJob);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete jobs.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete jobs.`
    );
  }
};

// Check if email exists for job application
export const checkEmailForJobApplication = async (req, res) => {
  try {
    const { email } = req.body;
    const { jobId } = req.params;

    if (!email) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Email is required'
      );
    }

    if (!jobId) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Job ID is required'
      );
    }

    const job = await fetchJobService(jobId);
    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    const applicant = await findApplicantByField('email', email.toLowerCase());

    if (applicant) {
      const existingApplication = await jobApplication.findOne({
        email: email.toLowerCase(),
        job_id: job._id,
        isDeleted: false,
      });

      if (existingApplication) {
        return HandleResponse(
          res,
          false,
          StatusCodes.CONFLICT,
          'You have already applied for this job',
          {
            emailExists: true,
            alreadyApplied: true,
            applicantId: applicant._id,
            applicationId: existingApplication._id,
          }
        );
      }

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email found. You can apply for this job.',
        {
          emailExists: true,
          alreadyApplied: false,
          applicantId: applicant._id,
          applicantName: `${applicant.name?.firstName || ''} ${
            applicant.name?.lastName || ''
          }`.trim(),
          formUrl: `${
            process.env.FRONT_URL || ''
          }applicants/applicant-edit-qr-code/${applicant._id}`,
        }
      );
    } else {
      // Email not found - provide option to fill form
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email not found. Please fill the form to apply.',
        {
          emailExists: false,
          formUrl: `${
            process.env.FRONT_URL || ''
          }applicants/applicant-add-qr-code`,
        }
      );
    }
  } catch (error) {
    logger.error(`Failed to check email for job application: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to check email for job application`
    );
  }
};

// Apply for job (add to jobApplication table)
export const applyForJob = async (req, res) => {
  try {
    const { email } = req.body;
    const { jobId } = req.params;

    if (!email) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Email is required'
      );
    }

    if (!jobId) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Job ID is required'
      );
    }

    // Check if job exists
    const job = await fetchJobService(jobId);
    console.log(job);
    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    // Check if applicant exists
    const applicant = await findApplicantByField('email', email.toLowerCase());
    if (!applicant) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Applicant not found. Please fill the form first.',
        {
          formUrl: `${
            process.env.FRONT_URL || ''
          }applicants/applicant-add-qr-code`,
        }
      );
    }

    const existingApplication = await jobApplication.findOne({
      email: email.toLowerCase(),
      job_id: job._id,
      isDeleted: false,
    });

    if (existingApplication) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'You have already applied for this job',
        {
          applicationId: existingApplication._id,
        }
      );
    }

    // Create job application
    const jdText = `jobsubject: ${job.job_subject}, jobdetails: ${
      job.job_details?.replace(/<[^>]*>/g, '') || ''
    }, jobtype: ${job.job_type}, job location: ${
      job.job_location
    }, min experience: ${job.min_experience || ''}, contractduration: ${
      job.contract_duration || ''
    }, ${job.required_skills?.join(', ') || ''}, work preference :${
      job.work_preference || ''
    }`;

    // Get applicant resume text if available (for scoring)
    let resumeText = '';
    if (applicant.resume) {
      // If resume URL exists, you might want to extract text from it
      // For now, we'll use applicant skills
      resumeText = `${applicant.appliedSkills?.join(', ') || ''} ${
        applicant.otherSkills || ''
      }`;
    } else {
      resumeText = `${applicant.appliedSkills?.join(', ') || ''} ${
        applicant.otherSkills || ''
      }`;
    }

    const newApplication = new jobApplication({
      name: applicant.name || {
        firstName: applicant.name?.firstName || 'Applicant',
        lastName: applicant.name?.lastName || '',
      },
      phone: applicant.phone || {
        phoneNumber: applicant.phone?.phoneNumber || '',
        whatsappNumber: applicant.phone?.whatsappNumber || '',
      },
      email: applicant.email,
      job_id: job._id,
      vendor_id: job.addedBy,
      otherSkills: applicant.otherSkills || '',
      appliedRole: applicant.appliedRole || '',
      isActive: true,
      resumeUrl: applicant.resumeUrl || applicant.resume || '',
      addedBy: applicantEnum.GUEST,
      user_id: applicant.user_id || null,
      score: calculateJobScore(resumeText, jdText),
      status: applicantEnum.APPLIED,
    });

    await newApplication.save();

    logger.info(
      `Job application ${Message.ADDED_SUCCESSFULLY} for job ${jobId}`
    );
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Application ${Message.ADDED_SUCCESSFULLY}`,
      {
        applicationId: newApplication._id,
        jobId: job._id,
        jobSubject: job.job_subject,
      }
    );
  } catch (error) {
    logger.error(`Failed to apply for job: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to apply for job: ${error.message}`
    );
  }
};

// View applicants for vendor's jobs
export const viewApplicantsForVendorJobs = async (req, res) => {
  try {
    const user = req.user || {};
    const {
      page = 1,
      limit = 10,
      jobId,
      status,
      search,
      appliedSkills,
      minScore,
      maxScore,
    } = req.query;

    // Check if user is a vendor
    if (user.role !== Enum.VENDOR) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only vendors can view applicants for their jobs'
      );
    }

    const query = {
      isDeleted: false,
      vendor_id: user.id, // Filter by vendor_id to show only applicants for vendor's jobs
    };

    // Filter by specific job if provided
    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid job ID'
        );
      }
      query.job_id = jobId;
    }

    // Filter by application status
    if (status) {
      query.status = status;
    }

    // Filter by applied skills
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

    // Filter by score range
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = parseFloat(minScore);
      if (maxScore) query.score.$lte = parseFloat(maxScore);
    }

    // Search functionality
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { 'name.middleName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
        { 'phone.whatsappNumber': searchRegex },
      ];
    }

    const result = await pagination({
      Schema: jobApplication,
      page: parseInt(page),
      limit: parseInt(limit),
      query,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'job_id',
          model: 'jobs',
          select: 'job_id job_subject job_type job_location required_skills',
        },
      ],
    });

    if (!result || result?.length === 0) {
      logger.info(`No applicants found for vendor's jobs`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'No applicants found for your jobs',
        {
          applications: [],
          pagination: {
            totalCount: 0,
            currentPage: parseInt(page),
            totalPages: 0,
            limit: parseInt(limit),
          },
        }
      );
    }

    logger.info(`Applicants for vendor's jobs ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicants ${Message.FETCH_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} fetch applicants for vendor jobs`,
      error
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicants for vendor jobs`
    );
  }
};

// View applicants for a specific job
export const viewApplicantsForJob = async (req, res) => {
  try {
    const user = req.user || {};
    const { jobId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      search,
      appliedSkills,
      minScore,
      maxScore,
    } = req.query;

    if (!jobId) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Job ID is required'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid job ID'
      );
    }

    // Check if job exists
    const job = await fetchJobService(jobId);
    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    // If user is vendor, verify the job belongs to them
    if (user.role === Enum.VENDOR || user.role === Enum.CLIENT) {
      if (job.addedBy.toString() !== user.id) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only view applicants for your own jobs'
        );
      }
    }

    const query = {
      isDeleted: false,
      job_id: jobId,
    };

    // Filter by application status
    if (status) {
      query.status = status;
    }

    // Filter by applied skills
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

    // Filter by score range
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = parseFloat(minScore);
      if (maxScore) query.score.$lte = parseFloat(maxScore);
    }

    // Search functionality
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { 'name.middleName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
        { 'phone.whatsappNumber': searchRegex },
      ];
    }

    const result = await pagination({
      Schema: jobApplication,
      page: parseInt(page),
      limit: parseInt(limit),
      query,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'job_id',
          model: 'jobs',
          select: 'job_id job_subject job_type job_location required_skills',
        },
      ],
    });

    if (!result || !result.item || result.item.length === 0) {
      logger.info(`No applicants found for job ${jobId}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'No applicants found for this job',
        {
          job: {
            _id: job._id,
            job_id: job.job_id,
            job_subject: job.job_subject,
          },
          applications: [],
          pagination: {
            totalCount: 0,
            currentPage: parseInt(page),
            totalPages: 0,
            limit: parseInt(limit),
          },
        }
      );
    }

    logger.info(`Applicants for job ${jobId} ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicants ${Message.FETCH_SUCCESSFULLY}`,
      {
        job: {
          _id: job._id,
          job_id: job.job_id,
          job_subject: job.job_subject,
          job_type: job.job_type,
          job_location: job.job_location,
        },
        applications: result.item,
        pagination: {
          totalCount: result.totalRecords,
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          limit: result.limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch applicants for job`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicants for job`
    );
  }
};
