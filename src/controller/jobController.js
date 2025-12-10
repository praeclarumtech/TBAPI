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
import {
  jobCreatedTemplate,
  jobNotificationTemplate,
  vendorJobNotificationTemplate,
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
import { getEmailTemplateById } from '../services/emailTemplateService.js';

const sendJobNotificationsToMatchingApplicants = async (job, jobId) => {
  let applicantEmailStatus = { sent: 0, failed: 0, errors: [] };

  try {
    const requiredSkills = job.required_skills || [];

    if (requiredSkills.length > 0 && Array.isArray(requiredSkills)) {
      const normalizedJobSkills = requiredSkills.map((skill) =>
        skill.trim().toLowerCase()
      );

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
      }).limit(100);

      if (matchingApplicants.length > 0) {
        logger.info(
          `Found ${matchingApplicants.length} matching applicants for job ${jobId}`
        );

        let companyName = '';
        if (job.addedBy) {
          const jobCreator = await User.findById(job.addedBy)
            .populate('roleId')
            .select('role');
          if (jobCreator) {
            const jobCreatorRole = jobCreator.roleId?.name || jobCreator.role;
            if (
              jobCreatorRole === Enum.VENDOR ||
              jobCreatorRole === Enum.CLIENT
            ) {
              const vendor = await findVendorByUserId({
                userId: job.addedBy,
              });
              companyName = vendor?.company_name || '';
            }
          }
        }

        const baseUrl = process.env.FRONT_URL || '';
        const jobIdForUrl = job._id || job._id?.toString();

        for (const applicant of matchingApplicants) {
          try {
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
              jobTitle: job.job_subject,
              jobSubject: job.job_subject,
              jobId: jobId,
              hrEmail: process.env.HR_EMAIL || 'hr@talentbox.com',
              applicationUrl: applicationUrl,
            });

            await sendingEmailHelper({
              email_to: applicant.email,
              subject: `New Job Opportunity: ${
                job.job_subject || 'Job Opening'
              }`,
              description: emailContent,
              inlineImages: [inlineImage],
              email: applicant.email,
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

const sendJobNotificationsToAllVendors = async (job, jobId) => {
  let vendorEmailStatus = { sent: 0, failed: 0, errors: [] };

  try {
    // Get all active vendors
    const vendorRole = await getRoleByNameService(Enum.VENDOR);
    if (!vendorRole) {
      logger.warn('Vendor role not found, skipping vendor notifications');
      return vendorEmailStatus;
    }

    const activeVendors = await User.find({
      roleId: vendorRole._id,
      isDeleted: false,
      isActive: true,
      email: { $exists: true, $ne: '' },
    })
      .populate('vendorProfileId')
      .limit(100); // Limit to prevent overwhelming the system

    if (activeVendors.length === 0) {
      logger.info('No active vendors found for job notification');
      return vendorEmailStatus;
    }

    logger.info(
      `Found ${activeVendors.length} active vendors to notify for job ${jobId}`
    );

    // Get client information
    let clientName = 'Client';
    let companyName = '';
    if (job.addedBy) {
      const jobCreator = await User.findById(job.addedBy)
        .populate('roleId')
        .select('firstName lastName role');
      if (jobCreator) {
        clientName =
          jobCreator.firstName && jobCreator.lastName
            ? `${jobCreator.firstName} ${jobCreator.lastName}`
            : jobCreator.firstName || 'Client';
        const jobCreatorRole = jobCreator.roleId?.name || jobCreator.role;
        if (jobCreatorRole === Enum.VENDOR || jobCreatorRole === Enum.CLIENT) {
          const vendor = await findVendorByUserId({
            userId: job.addedBy,
          });
          companyName = vendor?.company_name || '';
        }
      }
    }

    const baseUrl = process.env.FRONT_URL || '';
    const vendorApplicationUrl = `${baseUrl}login`; // Vendors redirect to login

    // Prepare job details (strip HTML tags for cleaner display)
    const jobDetailsText = job.job_details
      ? job.job_details.replace(/<[^>]*>/g, '').substring(0, 500)
      : '';

    for (const vendorUser of activeVendors) {
      try {
        if (!vendorUser.email) {
          vendorEmailStatus.failed++;
          vendorEmailStatus.errors.push({
            vendorId: vendorUser._id,
            error: 'Vendor email not found',
          });
          continue;
        }

        const vendorName =
          vendorUser.firstName && vendorUser.lastName
            ? `${vendorUser.firstName} ${vendorUser.lastName}`
            : vendorUser.firstName || 'Vendor';

        const vendorCompanyName =
          vendorUser.vendorProfileId?.company_name || companyName || '';

        // Use vendor-specific notification template (same style as applicant template)
        const emailContent = vendorJobNotificationTemplate({
          jobTitle: job.job_subject,
          jobSubject: job.job_subject,
          jobId: jobId,
          hrEmail: process.env.HR_EMAIL || 'hr@talentbox.com',
        });
        const emailSubject = `New Job Added: ${
          job.job_subject || 'Job Opening'
        }`;

        await sendingEmailHelper({
          email_to: vendorUser.email,
          subject: emailSubject,
          description: emailContent,
          email: vendorUser.email,
        });

        vendorEmailStatus.sent++;
        logger.info(`Job notification sent to vendor: ${vendorUser.email}`);
      } catch (emailErr) {
        vendorEmailStatus.failed++;
        vendorEmailStatus.errors.push({
          vendorId: vendorUser._id,
          email: vendorUser.email,
          error: emailErr.message,
        });
        logger.error(
          `Failed to send job notification to vendor ${vendorUser.email}:`,
          emailErr
        );
      }
    }
  } catch (vendorErr) {
    logger.error('Error finding/sending emails to vendors:', vendorErr);
    vendorEmailStatus.errors.push({
      general: vendorErr.message,
    });
  }

  return vendorEmailStatus;
};

export const sendJobNotificationsToApplicants = async (req, res) => {
  try {
    const user = req.user || {};
    const { jobId } = req.params;

    // Validate job ID
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
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

    if (user.role === Enum.CLIENT || user.role === Enum.VENDOR) {
      if (job.addedBy.toString() !== user.id) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only send notifications for your own jobs'
        );
      }
    } else if (user.role !== Enum.ADMIN) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients, vendors, and admins can send job notifications'
      );
    }

    const applicantEmailStatus = await sendJobNotificationsToMatchingApplicants(
      job,
      jobId
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job notifications sent: ${applicantEmailStatus.sent} successful, ${applicantEmailStatus.failed} failed`,
      {
        emailStatus: applicantEmailStatus,
        job: {
          _id: job._id,
          job_id: job.job_id,
          job_subject: job.job_subject,
        },
      }
    );
  } catch (error) {
    logger.error(`Failed to send job notifications: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send job notifications: ${error.message}`
    );
  }
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
      const vendorId = new mongoose.Types.ObjectId(user.id);
      query.$or = [{ addedBy: vendorId }, { emailedVendors: vendorId }];
    } else if (user?.role === Enum.CLIENT) {
      query.addedBy = user.id;
    }

    if (filterBy === Enum.VENDOR) {
      const vendorRole = await getRoleByNameService(Enum.VENDOR);
      const vendorUsers = await getAllusers(
        { roleId: vendorRole._id },
        { _id: 1 }
      );
      const vendorIds = vendorUsers.map((v) => v._id);

      if (user?.role === Enum.VENDOR && query.$or) {
      } else {
        query.addedBy = { $in: vendorIds };
      }
    } else if (filterBy === Enum.CLIENT) {
      const clientRole = await getRoleByNameService(Enum.CLIENT);
      const clientUsers = await getAllusers(
        { roleId: clientRole._id },
        { _id: 1 }
      );
      const clientIds = clientUsers.map((v) => v._id);

      if (user?.role === Enum.VENDOR && query.$or) {
        const vendorId = new mongoose.Types.ObjectId(user.id);
        query.$or = [
          {
            $and: [
              { addedBy: { $in: clientIds } },
              { emailedVendors: vendorId },
            ],
          },
        ];
      } else {
        query.addedBy = { $in: clientIds };
      }
    }

    if (search && typeof search === 'string') {
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '');
      const flexiblePattern = cleanSearch.split('').join('[-_\\s]*');
      const regex = new RegExp(flexiblePattern, 'i');

      if (user?.role === Enum.VENDOR && query.$or) {
        query.$and = [
          {
            $or: query.$or,
          },
          {
            $or: [
              { job_subject: { $regex: regex } },
              { job_type: { $regex: regex } },
            ],
          },
        ];
        delete query.$or;
      } else {
        query.$or = [
          { job_subject: { $regex: regex } },
          { job_type: { $regex: regex } },
        ];
      }
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

    if (user?.role === Enum.VENDOR && result?.item) {
      const vendorId = new mongoose.Types.ObjectId(user.id);

      // Get all unique client IDs for client jobs
      const clientJobIds = result.item
        .filter((job) => {
          const jobObj = job.toObject ? job.toObject() : job;
          return jobObj.addedBy?.toString() !== user.id;
        })
        .map((job) => {
          const jobObj = job.toObject ? job.toObject() : job;
          return jobObj.addedBy;
        });

      // Fetch client details for all client jobs
      const clientUsers = await User.find({
        _id: { $in: clientJobIds },
      }).select('firstName lastName userName');

      // Create a map of client ID to client name
      const clientNameMap = {};
      clientUsers.forEach((client) => {
        const clientName =
          client.firstName && client.lastName
            ? `${client.firstName} ${client.lastName}`
            : client.firstName || client.userName || 'Client';
        clientNameMap[client._id.toString()] = clientName;
      });

      result.item = result.item.map((job) => {
        const jobObj = job.toObject ? job.toObject() : job;
        const isClientJob = jobObj.addedBy?.toString() !== user.id;
        const wasEmailed = jobObj.emailedVendors?.some(
          (id) => id.toString() === vendorId.toString()
        );
        jobObj.canShare = isClientJob && wasEmailed;
        jobObj.isClientJob = isClientJob;

        // Add client name if it's a client job
        if (isClientJob && jobObj.addedBy) {
          jobObj.clientName =
            clientNameMap[jobObj.addedBy.toString()] || 'Client';
        }

        return jobObj;
      });
    }

    // Add clientName for ADMIN role - show only CLIENT job creator's name
    if (user?.role === Enum.ADMIN && result?.item) {
      // Get all unique job creator IDs
      const creatorIds = result.item
        .map((job) => {
          const jobObj = job.toObject ? job.toObject() : job;
          return jobObj.addedBy;
        })
        .filter((id) => id);

      // Fetch all job creators' details with role information
      const creatorUsers = await User.find({
        _id: { $in: creatorIds },
      })
        .populate('roleId', 'name')
        .select('firstName lastName userName role roleId');

      // Create a map of creator ID to creator info (only for clients)
      const clientNameMap = {};
      creatorUsers.forEach((creator) => {
        const creatorRole = creator.roleId?.name || creator.role || '';
        // Only add to map if creator is a CLIENT
        if (creatorRole.toLowerCase() === Enum.CLIENT.toLowerCase()) {
          const clientName =
            creator.firstName && creator.lastName
              ? `${creator.firstName} ${creator.lastName}`
              : creator.firstName || creator.userName || 'Client';
          clientNameMap[creator._id.toString()] = clientName;
        }
      });

      result.item = result.item.map((job) => {
        const jobObj = job.toObject ? job.toObject() : job;

        // Add client name only if job creator is a CLIENT
        if (jobObj.addedBy && clientNameMap[jobObj.addedBy.toString()]) {
          jobObj.clientName = clientNameMap[jobObj.addedBy.toString()];
        }

        return jobObj;
      });
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
    const response = {
      ...(result._doc || result),
      hrEmail: process.env.HR_EMAIL || 'hr@talentbox.com',
    };
    logger.info(`Job ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, undefined, response);
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
    const user = req.user || {};
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

    const isActivating =
      existJob.isActive === false && req.body.isActive === true;
    const isVendorActivating =
      isActivating &&
      user.role === Enum.VENDOR &&
      existJob.addedBy.toString() === user.id;
    const isClientActivating =
      isActivating &&
      user.role === Enum.CLIENT &&
      existJob.addedBy.toString() === user.id;

    await updateJobService(jobId, req.body);
    logger.info(`Job ${Message.UPDATED_SUCCESSFULLY}`);

    let notificationStatus = null;
    // Commented out: Email notifications on job activation
    // if (isVendorActivating) {
    //   try {
    //     const updatedJob = await fetchJobService(jobId);
    //     notificationStatus = await sendJobNotificationsToMatchingApplicants(
    //       updatedJob,
    //       jobId
    //     );
    //     logger.info(
    //       `Job activation notifications sent: ${notificationStatus.sent} successful, ${notificationStatus.failed} failed`
    //     );
    //   } catch (notifErr) {
    //     logger.error(
    //       `Failed to send job activation notifications: ${notifErr.message}`
    //     );
    //   }
    // } else if (isClientActivating) {
    //   try {
    //     const updatedJob = await fetchJobService(jobId);

    //     // Send notifications to all active vendors
    //     const vendorNotificationStatus = await sendJobNotificationsToAllVendors(
    //       updatedJob,
    //       jobId
    //     );

    //     // Send notifications to matching applicants
    //     const applicantNotificationStatus =
    //       await sendJobNotificationsToMatchingApplicants(updatedJob, jobId);

    //     notificationStatus = {
    //       vendors: {
    //         sent: vendorNotificationStatus.sent,
    //         failed: vendorNotificationStatus.failed,
    //         errors: vendorNotificationStatus.errors,
    //       },
    //       applicants: {
    //         sent: applicantNotificationStatus.sent,
    //         failed: applicantNotificationStatus.failed,
    //         errors: applicantNotificationStatus.errors,
    //       },
    //     };

    //     logger.info(
    //       `Client job activation notifications sent - Vendors: ${vendorNotificationStatus.sent} successful, ${vendorNotificationStatus.failed} failed; Applicants: ${applicantNotificationStatus.sent} successful, ${applicantNotificationStatus.failed} failed`
    //     );
    //   } catch (notifErr) {
    //     logger.error(
    //       `Failed to send client job activation notifications: ${notifErr.message}`
    //     );
    //   }
    // }

    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Job ${Message.UPDATED_SUCCESSFULLY}`,
      notificationStatus
        ? isClientActivating
          ? {
              notificationStatus: {
                vendors: notificationStatus.vendors,
                applicants: notificationStatus.applicants,
              },
            }
          : {
              notificationStatus: {
                sent: notificationStatus.sent,
                failed: notificationStatus.failed,
                errors: notificationStatus.errors,
              },
            }
        : undefined
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

export const checkEmailForJobApplication = async (req, res) => {
  try {
    const { email } = req.body;
    const { jobId } = req.params;
    console.log(email, jobId);

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

    const normalizedEmail = email.trim().toLowerCase();
    const applicant = await findApplicantByField('email', normalizedEmail);

    if (applicant) {
      const existingApplication = await jobApplication.findOne({
        $or: [
          { email: normalizedEmail },
          {
            email: {
              $regex: new RegExp(
                `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                'i'
              ),
            },
          },
        ],
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

export const applyForJob = async (req, res) => {
  try {
    const { email, sharedBy } = req.body;
    const { jobId } = req.params;
    // sharedBy can also be passed as query parameter
    const sharedById = sharedBy || req.query.sharedBy;

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

    let vendorId = null;
    let clientId = null;

    // If sharedBy is provided, check who shared the job
    if (sharedById && mongoose.Types.ObjectId.isValid(sharedById)) {
      const sharedByUser = await User.findById(sharedById)
        .populate('roleId', 'name')
        .select('role roleId');

      if (sharedByUser) {
        const sharedByRole = (
          sharedByUser.roleId?.name ||
          sharedByUser.role ||
          ''
        ).toLowerCase();

        if (sharedByRole === Enum.VENDOR.toLowerCase()) {
          // Shared by VENDOR
          vendorId = sharedById;
          clientId = null;
        } else if (sharedByRole === Enum.CLIENT.toLowerCase()) {
          // Shared by CLIENT
          clientId = sharedById;
          vendorId = null;
        }
      }
    } else {
      // No sharedBy provided, fall back to job creator
      const jobCreator = await User.findById(job.addedBy)
        .populate('roleId', 'name')
        .select('role roleId');

      const creatorRole = (
        jobCreator?.roleId?.name ||
        jobCreator?.role ||
        ''
      ).toLowerCase();

      if (creatorRole === Enum.CLIENT.toLowerCase()) {
        clientId = job.addedBy;
        vendorId = null;
      } else if (creatorRole === Enum.VENDOR.toLowerCase()) {
        vendorId = job.addedBy;
        clientId = null;
      }
    }

    const jdText = `jobsubject: ${job.job_subject}, jobdetails: ${
      job.job_details?.replace(/<[^>]*>/g, '') || ''
    }, jobtype: ${job.job_type}, job location: ${
      job.job_location
    }, min experience: ${job.min_experience || ''}, contractduration: ${
      job.contract_duration || ''
    }, ${job.required_skills?.join(', ') || ''}, work preference :${
      job.work_preference || ''
    }`;

    let resumeText = '';
    if (applicant.resume) {
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
      vendor_id: vendorId,
      client_id: clientId,
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
      vendor_id: user.id,
    };

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

    if (status) {
      query.status = status;
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

    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = parseFloat(minScore);
      if (maxScore) query.score.$lte = parseFloat(maxScore);
    }

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

    if (user.role === Enum.VENDOR) {
      const vendorId = new mongoose.Types.ObjectId(user.id);
      const ownsJob = job.addedBy.toString() === user.id;
      const wasEmailed = job.emailedVendors?.some(
        (id) => id.toString() === vendorId.toString()
      );
      if (!ownsJob && !wasEmailed) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only view applicants for your own jobs or client jobs you were emailed about'
        );
      }
    } else if (user.role === Enum.CLIENT) {
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

    if (status) {
      query.status = status;
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

    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = parseFloat(minScore);
      if (maxScore) query.score.$lte = parseFloat(maxScore);
    }

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
        {
          path: 'vendor_id',
          model: 'user',
          select: 'firstName lastName email vendorProfileId',
          populate: {
            path: 'vendorProfileId',
            select: 'company_name',
          },
        },
        {
          path: 'client_id',
          model: 'user',
          select: 'firstName lastName email vendorProfileId',
          populate: {
            path: 'vendorProfileId',
            select: 'company_name',
          },
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

    // Process applications - vendor_id and client_id are now properly set
    const processedApplications = result.item.map((application) => {
      const appObj = application.toObject
        ? application.toObject()
        : application;
      return appObj;
    });

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
        applications: processedApplications,
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

export const viewClientJobApplications = async (req, res) => {
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

    if (user.role !== Enum.CLIENT) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients can view job applications'
      );
    }

    let query = {
      isDeleted: false,
    };

    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid job ID'
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

      if (job.addedBy.toString() !== user.id) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only view applications for your own jobs'
        );
      }

      query.job_id = jobId;
    } else {
      const clientJobs = await jobs
        .find({ addedBy: user.id, isDeleted: false }, '_id')
        .lean();
      const jobIds = clientJobs.map((job) => job._id);
      query.job_id = { $in: jobIds };
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

    // Fetch applicants
    const applicantsResult = await pagination({
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

    const responseData = {
      applicants: applicantsResult?.item || [],
      applicantsPagination: applicantsResult
        ? {
            totalCount: applicantsResult.totalRecords,
            currentPage: applicantsResult.currentPage,
            totalPages: applicantsResult.totalPages,
            limit: applicantsResult.limit,
          }
        : {
            totalCount: 0,
            currentPage: parseInt(page),
            totalPages: 0,
            limit: parseInt(limit),
          },
    };

    if (!applicantsResult || applicantsResult.item.length === 0) {
      logger.info(`No applicants found for client's jobs`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'No applicants found',
        responseData
      );
    }

    logger.info(`Client job applications ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job applications ${Message.FETCH_SUCCESSFULLY}`,
      responseData
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch client job applications`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch client job applications`
    );
  }
};

export const sendJobEmailToRecipients = async (req, res) => {
  try {
    const user = req.user || {};
    const { jobId } = req.params;
    const {
      vendorIds = [],
      applicantIds = [],
      customMessage,
      emailTemplateId,
    } = req.body;

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid job ID'
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

    if (user.role === Enum.CLIENT) {
      if (job.addedBy.toString() !== user.id) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only send emails for your own jobs'
        );
      }
    } else if (user.role === Enum.VENDOR) {
      const vendorId = new mongoose.Types.ObjectId(user.id);
      const ownsJob = job.addedBy.toString() === user.id;
      const isClientJob = !ownsJob;

      if (isClientJob) {
        if (
          !job.emailedVendors ||
          !job.emailedVendors.some(
            (id) => id.toString() === vendorId.toString()
          )
        ) {
          return HandleResponse(
            res,
            false,
            StatusCodes.FORBIDDEN,
            'You can only share client jobs you were emailed about'
          );
        }
      }

      if (vendorIds && vendorIds.length > 0) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'Vendors can only share jobs with applicants, not with other vendors'
        );
      }
    } else if (user.role !== Enum.ADMIN) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients, admins, and vendors can send job emails'
      );
    }

    if (
      (!vendorIds || vendorIds.length === 0) &&
      (!applicantIds || applicantIds.length === 0)
    ) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Please select at least one vendor or applicant'
      );
    }

    const MAX_RECIPIENTS = 500;
    const totalRecipients =
      (vendorIds?.length || 0) + (applicantIds?.length || 0);
    if (totalRecipients > MAX_RECIPIENTS) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Maximum ${MAX_RECIPIENTS} recipients allowed per request. You selected ${totalRecipients} recipients. Please split into multiple requests.`
      );
    }

    const emailStatus = {
      vendors: { sent: 0, failed: 0, errors: [] },
      applicants: { sent: 0, failed: 0, errors: [] },
    };

    const successfullyEmailedVendorIds = [];
    const successfullyEmailedApplicantIds = [];

    const senderUser = await User.findById(user.id).populate('roleId', 'name');
    let senderName = '';
    let companyName = '';
    let clientName = '';

    if (user.role === Enum.CLIENT) {
      senderName =
        senderUser.firstName && senderUser.lastName
          ? `${senderUser.firstName} ${senderUser.lastName}`
          : senderUser.firstName || 'Client';
      if (senderUser.vendorProfileId) {
        const vendor = await findVendorByUserId({ userId: user.id });
        companyName = vendor?.company_name || '';
      }
      clientName = senderName;
    } else if (user.role === Enum.VENDOR) {
      senderName =
        senderUser.firstName && senderUser.lastName
          ? `${senderUser.firstName} ${senderUser.lastName}`
          : senderUser.firstName || 'Vendor';
      const vendor = await findVendorByUserId({ userId: user.id });
      companyName = vendor?.company_name || '';

      const originalClient = await User.findById(job.addedBy).populate(
        'roleId',
        'name'
      );
      clientName =
        originalClient.firstName && originalClient.lastName
          ? `${originalClient.firstName} ${originalClient.lastName}`
          : originalClient.firstName || 'Client';
    }

    let emailTemplate = null;
    if (emailTemplateId && mongoose.Types.ObjectId.isValid(emailTemplateId)) {
      try {
        emailTemplate = await getEmailTemplateById(emailTemplateId);
        if (!emailTemplate || emailTemplate.isDeleted) {
          logger.warn(
            `Email template ${emailTemplateId} not found or deleted, using default template`
          );
          emailTemplate = null;
        }
      } catch (templateErr) {
        logger.error(`Error fetching email template: ${templateErr.message}`);
        emailTemplate = null;
      }
    }

    const baseUrl = process.env.FRONT_URL || '';
    const jobIdForUrl = job._id || job._id?.toString();
    const vendorApplicationUrl = `${baseUrl}login`; // Vendors redirect to login
    const applicantApplicationUrl = `${baseUrl}vendor/email-check-apply?jobId=${jobIdForUrl}`; // Applicants redirect to application

    const replaceTemplatePlaceholders = (template, replacements) => {
      let result = template;
      Object.keys(replacements).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, replacements[key] || '');
      });
      return result;
    };

    if (vendorIds && vendorIds.length > 0) {
      for (const vendorId of vendorIds) {
        try {
          if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            emailStatus.vendors.failed++;
            emailStatus.vendors.errors.push({
              vendorId,
              error: 'Invalid vendor ID',
            });
            continue;
          }
          const vendorUser = await User.findById(
            new mongoose.Types.ObjectId(vendorId)
          )
            .populate('roleId', 'name')
            .populate('vendorProfileId');

          if (!vendorUser) {
            emailStatus.vendors.failed++;
            emailStatus.vendors.errors.push({
              vendorId,
              error: 'User not found',
            });
            continue;
          }

          if (vendorUser.isDeleted) {
            emailStatus.vendors.failed++;
            emailStatus.vendors.errors.push({
              vendorId,
              error: 'User is deleted',
            });
            continue;
          }

          if (!vendorUser.isActive) {
            emailStatus.vendors.failed++;
            emailStatus.vendors.errors.push({
              vendorId,
              error: 'User is inactive',
            });
            continue;
          }

          const userRole = vendorUser.roleId?.name || vendorUser.role;
          if (userRole !== Enum.VENDOR) {
            emailStatus.vendors.failed++;
            emailStatus.vendors.errors.push({
              vendorId,
              error: `User is not a vendor. Current role: ${
                userRole || 'unknown'
              }`,
            });
            logger.warn(
              `User ${vendorId} is not a vendor. Role: ${userRole}, roleId: ${vendorUser.roleId?._id}`
            );
            continue;
          }

          if (!vendorUser.email) {
            emailStatus.vendors.failed++;
            emailStatus.vendors.errors.push({
              vendorId,
              error: 'Vendor email not found',
            });
            continue;
          }

          const vendorName =
            vendorUser.firstName && vendorUser.lastName
              ? `${vendorUser.firstName} ${vendorUser.lastName}`
              : vendorUser.firstName || 'Vendor';

          const vendorCompanyName =
            vendorUser.vendorProfileId?.company_name || companyName || '';

          const jobDetailsText = job.job_details
            ? job.job_details.replace(/<[^>]*>/g, '').substring(0, 500)
            : '';

          let emailContent, emailSubject;
          if (emailTemplate) {
            const replacements = {
              recipientName: vendorName,
              jobTitle: job.job_subject || 'Job Opening',
              jobSubject: job.job_subject || 'Job Opening',
              jobId: job._id?.toString() || jobIdForUrl,
              jobType: job.job_type || '',
              jobLocation: job.job_location || '',
              jobDetails: jobDetailsText,
              companyName: vendorCompanyName,
              clientName: clientName,
              customMessage: customMessage || '',
              applicationUrl: vendorApplicationUrl,
              hrEmail: process.env.HR_EMAIL || 'hr@talentbox.com',
              FRONT_URL: baseUrl,
              qrCodeHtml: '',
            };
            emailContent = replaceTemplatePlaceholders(
              emailTemplate.description,
              replacements
            );
            emailContent = emailContent.replace(/{{qrCodeHtml}}/g, '');
            emailSubject = replaceTemplatePlaceholders(
              emailTemplate.subject,
              replacements
            );
          } else {
            emailContent = `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                  <h2 style="color: #2c3e50; margin: 0 0 15px 0;">New Job Added</h2>
                  <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">Dear ${vendorName},</p>
                  <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">A new job has been added that might interest you.</p>
                  ${
                    customMessage
                      ? `<div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                          <p style="color: #004085; margin: 0; font-weight: 600;">Message from Client:</p>
                          <p style="color: #004085; margin: 10px 0 0 0;">${customMessage}</p>
                        </div>`
                      : ''
                  }
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p style="color: #2c3e50; margin: 0 0 10px 0;"><strong>Job Title:</strong> ${
                      job.job_subject || 'N/A'
                    }</p>
                    ${
                      job.job_type
                        ? `<p style="color: #2c3e50; margin: 0 0 10px 0;"><strong>Job Type:</strong> ${job.job_type}</p>`
                        : ''
                    }
                    ${
                      job.job_location
                        ? `<p style="color: #2c3e50; margin: 0 0 10px 0;"><strong>Location:</strong> ${job.job_location}</p>`
                        : ''
                    }
                    ${
                      jobDetailsText
                        ? `<p style="color: #2c3e50; margin: 10px 0 0 0;"><strong>Description:</strong><br/>${jobDetailsText}</p>`
                        : ''
                    }
                  </div>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="${vendorApplicationUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: 600;">Login to View Job</a>
                  </div>
                  <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">Best regards,<br/><strong>${clientName}</strong></p>
                </div>
              </div>
            `;
            emailSubject = `New Job Added: ${job.job_subject || 'Job Opening'}`;
          }

          await sendingEmailHelper({
            email_to: vendorUser.email,
            subject: emailSubject,
            description: emailContent,
            email: vendorUser.email,
          });

          emailStatus.vendors.sent++;
          successfullyEmailedVendorIds.push(
            new mongoose.Types.ObjectId(vendorId)
          );
          logger.info(
            `Job email sent to vendor ${vendorUser.email} for job ${jobId}`
          );
        } catch (vendorErr) {
          emailStatus.vendors.failed++;
          emailStatus.vendors.errors.push({
            vendorId,
            error: vendorErr.message,
          });
          logger.error(
            `Failed to send email to vendor ${vendorId}:`,
            vendorErr
          );
        }
      }
    }

    if (applicantIds && applicantIds.length > 0) {
      for (const applicantId of applicantIds) {
        try {
          if (!mongoose.Types.ObjectId.isValid(applicantId)) {
            emailStatus.applicants.failed++;
            emailStatus.applicants.errors.push({
              applicantId,
              error: 'Invalid applicant ID',
            });
            continue;
          }

          const applicant = await Applicant.findById(applicantId);

          if (!applicant || applicant.isDeleted) {
            emailStatus.applicants.failed++;
            emailStatus.applicants.errors.push({
              applicantId,
              error: 'Applicant not found',
            });
            continue;
          }

          if (!applicant.email) {
            emailStatus.applicants.failed++;
            emailStatus.applicants.errors.push({
              applicantId,
              error: 'Applicant email not found',
            });
            continue;
          }

          const applicantName =
            applicant.name?.firstName && applicant.name?.lastName
              ? `${applicant.name.firstName} ${applicant.name.lastName}`
              : applicant.name?.firstName || 'Applicant';

          const applicationUrl = applicantApplicationUrl;

          const jobDetailsText = job.job_details
            ? job.job_details.replace(/<[^>]*>/g, '').substring(0, 500)
            : '';

          let emailContent, emailSubject;
          const isVendorSharing = user.role === Enum.VENDOR;

          // If vendor is sharing, use the original jobNotificationTemplate (same as sendJobNotificationsToApplicants)
          if (isVendorSharing) {
            let qrCodeHtml = '';
            let inlineImage = null;
            try {
              const qrCode = await QRCode.toDataURL(applicationUrl);
              const cid = `qr-job-${jobIdForUrl}-${applicant._id}@qr`;

              qrCodeHtml = `
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

              inlineImage = {
                base64: qrCode,
                cid: cid,
              };
            } catch (qrErr) {
              logger.error(
                `Failed to generate QR code for vendor sharing: ${qrErr.message}`
              );
            }

            emailContent = jobNotificationTemplate({
              jobTitle: job.job_subject || 'Job Opening',
              jobSubject: job.job_subject || 'Job Opening',
              jobId: job._id,
              hrEmail: process.env.HR_EMAIL || 'hr@talentbox.com',
              applicationUrl: applicationUrl,
              frontUrl: process.env.FRONT_URL || 'https://talentbox.com',
            });

            emailSubject = `New Job Opportunity: ${
              job.job_subject || 'Job Opening'
            }`;

            await sendingEmailHelper({
              email_to: applicant.email,
              subject: emailSubject,
              description: emailContent,
              inlineImages: inlineImage ? [inlineImage] : [],
              email: applicant.email,
            });

            emailStatus.applicants.sent++;
            successfullyEmailedApplicantIds.push(
              new mongoose.Types.ObjectId(applicantId)
            );
            logger.info(
              `Job email sent to applicant ${applicant.email} by vendor ${user.id} for job ${jobId}`
            );
            continue;
          }

          if (emailTemplate) {
            const replacements = {
              recipientName: applicantName,
              jobTitle: job.job_subject || 'Job Opening',
              jobSubject: job.job_subject || 'Job Opening',
              jobId: job._id?.toString() || jobIdForUrl,
              jobType: job.job_type || '',
              jobLocation: job.job_location || '',
              jobDetails: jobDetailsText,
              companyName: companyName,
              clientName: clientName,
              customMessage: customMessage || '',
              applicationUrl: applicationUrl,
              hrEmail: process.env.HR_EMAIL || 'hr@talentbox.com',
              FRONT_URL: baseUrl,
              qrCodeHtml: '', // No QR code
            };
            emailContent = replaceTemplatePlaceholders(
              emailTemplate.description,
              replacements
            );
            emailContent = emailContent.replace(/{{qrCodeHtml}}/g, '');
            emailSubject = replaceTemplatePlaceholders(
              emailTemplate.subject,
              replacements
            );
          } else {
            emailContent = `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                  <h2 style="color: #2c3e50; margin: 0 0 15px 0;">New Job Opportunity</h2>
                  <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">Dear ${applicantName},</p>
                  <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">A new job opportunity has been added that matches your skills.</p>
                  ${
                    customMessage
                      ? `<div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                          <p style="color: #004085; margin: 0; font-weight: 600;">Message from ${
                            user.role === Enum.ADMIN ? 'Admin' : 'Client'
                          }:</p>
                          <p style="color: #004085; margin: 10px 0 0 0;">${customMessage}</p>
                        </div>`
                      : ''
                  }
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p style="color: #2c3e50; margin: 0 0 10px 0;"><strong>Job Title:</strong> ${
                      job.job_subject || 'N/A'
                    }</p>
                    ${
                      job.job_type
                        ? `<p style="color: #2c3e50; margin: 0 0 10px 0;"><strong>Job Type:</strong> ${job.job_type}</p>`
                        : ''
                    }
                    ${
                      job.job_location
                        ? `<p style="color: #2c3e50; margin: 0 0 10px 0;"><strong>Location:</strong> ${job.job_location}</p>`
                        : ''
                    }
                    ${
                      jobDetailsText
                        ? `<p style="color: #2c3e50; margin: 10px 0 0 0;"><strong>Description:</strong><br/>${jobDetailsText}</p>`
                        : ''
                    }
                  </div>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="${applicationUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: 600;">Apply Now</a>
                  </div>
                  <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">Best regards,<br/><strong>${clientName}</strong></p>
                </div>
              </div>
            `;
            emailSubject = `New Job Opportunity: ${
              job.job_subject || 'Job Opening'
            }`;
          }

          await sendingEmailHelper({
            email_to: applicant.email,
            subject: emailSubject,
            description: emailContent,
            email: applicant.email,
          });

          emailStatus.applicants.sent++;
          successfullyEmailedApplicantIds.push(
            new mongoose.Types.ObjectId(applicantId)
          );
          logger.info(
            `Job email sent to applicant ${applicant.email} for job ${jobId}`
          );
        } catch (applicantErr) {
          emailStatus.applicants.failed++;
          emailStatus.applicants.errors.push({
            applicantId,
            error: applicantErr.message,
          });
          logger.error(
            `Failed to send email to applicant ${applicantId}:`,
            applicantErr
          );
        }
      }
    }

    const totalSent = emailStatus.vendors.sent + emailStatus.applicants.sent;
    const totalFailed =
      emailStatus.vendors.failed + emailStatus.applicants.failed;

    logger.info(
      `Job emails sent: ${totalSent} successful, ${totalFailed} failed for job ${jobId}`
    );

    if (
      successfullyEmailedVendorIds.length > 0 ||
      successfullyEmailedApplicantIds.length > 0
    ) {
      try {
        const updateData = {};
        if (
          successfullyEmailedVendorIds.length > 0 &&
          (user.role === Enum.CLIENT || user.role === Enum.ADMIN)
        ) {
          await jobs.findByIdAndUpdate(
            jobId,
            {
              $addToSet: {
                emailedVendors: { $each: successfullyEmailedVendorIds },
              },
            },
            { new: true }
          );
        }
        if (successfullyEmailedApplicantIds.length > 0) {
          await jobs.findByIdAndUpdate(
            jobId,
            {
              $addToSet: {
                emailedApplicants: { $each: successfullyEmailedApplicantIds },
              },
            },
            { new: true }
          );
        }
        logger.info(
          `Updated job ${jobId} with ${
            user.role === Enum.CLIENT || user.role === Enum.ADMIN
              ? successfullyEmailedVendorIds.length
              : 0
          } vendors and ${successfullyEmailedApplicantIds.length} applicants`
        );
      } catch (updateErr) {
        logger.error(
          `Failed to update job with emailed recipients: ${updateErr.message}`
        );
        // Don't fail the request if update fails
      }
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Emails sent: ${totalSent} successful, ${totalFailed} failed`,
      {
        emailStatus,
        job: {
          _id: job._id,
          job_id: job.job_id,
          job_subject: job.job_subject,
        },
      }
    );
  } catch (error) {
    logger.error(`Failed to send job emails: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send job emails: ${error.message}`
    );
  }
};

// Get vendors and applicants for email selection (Client only)
export const getVendorsAndApplicantsForEmail = async (req, res) => {
  try {
    const user = req.user || {};
    const { search, type, jobId } = req.query; // type: 'vendor', 'applicant', or 'all'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const result = {
      vendors: [],
      applicants: [],
    };

    // Fetch job details if jobId is provided (for skill matching)
    let jobRequiredSkills = [];
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      try {
        const job = await fetchJobService(jobId);
        if (job && job.required_skills && Array.isArray(job.required_skills)) {
          jobRequiredSkills = job.required_skills.map((skill) =>
            skill.trim().toLowerCase()
          );
        }
      } catch (jobErr) {
        logger.error(
          `Error fetching job for skill matching: ${jobErr.message}`
        );
      }
    }

    // Fetch vendors if type is 'vendor' or 'all'
    if (!type || type === 'vendor' || type === 'all') {
      try {
        const vendorRole = await getRoleByNameService(Enum.VENDOR);
        if (vendorRole) {
          let vendorQuery = {
            roleId: vendorRole._id,
            isDeleted: false,
            isActive: true,
          };

          // Add search filter if provided
          if (search && typeof search === 'string') {
            const searchRegex = new RegExp(
              search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i'
            );
            vendorQuery.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex },
              { userName: searchRegex },
            ];
          }

          const vendors = await pagination({
            Schema: User,
            page,
            limit,
            query: vendorQuery,
            sort: { createdAt: -1 },
            populate: {
              path: 'vendorProfileId',
              select: 'company_name company_email',
            },
          });

          // Format vendor data
          result.vendors = (vendors.item || []).map((vendor) => ({
            _id: vendor._id,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            email: vendor.email,
            userName: vendor.userName,
            companyName: vendor.vendorProfileId?.company_name || '',
            companyEmail: vendor.vendorProfileId?.company_email || '',
          }));
        }
      } catch (vendorErr) {
        logger.error(`Error fetching vendors: ${vendorErr.message}`);
      }
    }

    // Fetch applicants if type is 'applicant' or 'all'
    if (!type || type === 'applicant' || type === 'all') {
      try {
        let applicantQuery = {
          isDeleted: false,
          isActive: true,
          email: { $exists: true, $ne: '' },
        };

        // If jobId is provided and type is 'applicant', match applicants by required skills
        if (
          jobId &&
          jobRequiredSkills.length > 0 &&
          (type === 'applicant' || !type)
        ) {
          // Match applicants whose appliedSkills or otherSkills contain any of the required skills
          applicantQuery.$or = [
            {
              appliedSkills: {
                $in: jobRequiredSkills.map(
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
                $regex: jobRequiredSkills.join('|'),
                $options: 'i',
              },
            },
          ];
        }

        // Add search filter if provided (combine with skill matching if both exist)
        if (search && typeof search === 'string') {
          const searchRegex = new RegExp(
            search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
          );

          if (applicantQuery.$or) {
            // If $or already exists (from skill matching), combine with $and
            applicantQuery.$and = [
              { $or: applicantQuery.$or },
              {
                $or: [
                  { 'name.firstName': searchRegex },
                  { 'name.lastName': searchRegex },
                  { email: searchRegex },
                ],
              },
            ];
            delete applicantQuery.$or;
          } else {
            applicantQuery.$or = [
              { 'name.firstName': searchRegex },
              { 'name.lastName': searchRegex },
              { email: searchRegex },
            ];
          }
        }

        const applicants = await pagination({
          Schema: Applicant,
          page,
          limit,
          query: applicantQuery,
          sort: { createdAt: -1 },
        });

        // Format applicant data
        result.applicants = (applicants.item || []).map((applicant) => ({
          _id: applicant._id,
          firstName: applicant.name?.firstName || '',
          lastName: applicant.name?.lastName || '',
          email: applicant.email,
          phoneNumber: applicant.phone?.phoneNumber || '',
          appliedSkills: applicant.appliedSkills || [],
        }));
      } catch (applicantErr) {
        logger.error(`Error fetching applicants: ${applicantErr.message}`);
      }
    }

    logger.info(
      `Vendors and applicants fetched for client ${user.id}: ${result.vendors.length} vendors, ${result.applicants.length} applicants`
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Vendors and applicants fetched successfully',
      result
    );
  } catch (error) {
    logger.error(`Failed to fetch vendors and applicants: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to fetch vendors and applicants: ${error.message}`
    );
  }
};

// Send applicant status email based on logged-in user role
// - Client role: Send to vendor (if applicant has vendor_id) or admin (if no vendor)
// - Vendor role: Send to applicant
export const sendApplicantStatusEmail = async (req, res) => {
  try {
    const user = req.user || {};
    const {
      applicantName,
      applicantEmail,
      templateType,
      applicantStatus,
      applicantId,
      jobId,
    } = req.body;

    // Validate required fields
    if (
      !applicantName ||
      !applicantEmail ||
      !templateType ||
      !applicantStatus
    ) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Missing required fields: applicantName, applicantEmail, templateType, and applicantStatus are required'
      );
    }

    // Get logged-in user details
    const loggedInUser = await User.findById(user.id).populate('roleId');
    if (!loggedInUser) {
      return HandleResponse(
        res,
        false,
        StatusCodes.UNAUTHORIZED,
        'User not found'
      );
    }

    const userRole = loggedInUser.roleId?.name || loggedInUser.role || '';
    const normalizedRole = userRole.toLowerCase();

    // Get the email template by type
    const { getEmailTemplateByStatus } = await import(
      '../services/emailTemplateService.js'
    );
    const emailTemplate = await getEmailTemplateByStatus(templateType);

    if (!emailTemplate) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Email template with type '${templateType}' not found`
      );
    }

    // Prepare email content with dynamic placeholders
    let emailSubject = emailTemplate.subject;
    let emailDescription = emailTemplate.description;

    // Replace placeholders in template
    const placeholders = {
      '{{applicantName}}': applicantName,
      '{{applicantEmail}}': applicantEmail,
      '{{status}}': applicantStatus,
      '{{applicantStatus}}': applicantStatus,
    };

    // Get job details if jobId is provided
    let jobTitle = '';
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      const job = await fetchJobService(jobId);
      if (job) {
        jobTitle = job.job_subject || job.job_title || '';
        placeholders['{{jobTitle}}'] = jobTitle;
        placeholders['{{jobSubject}}'] = jobTitle;
      }
    }

    // Replace all placeholders
    Object.keys(placeholders).forEach((key) => {
      const regex = new RegExp(key, 'g');
      emailSubject = emailSubject.replace(regex, placeholders[key]);
      emailDescription = emailDescription.replace(regex, placeholders[key]);
    });

    let recipientEmail = '';
    let recipientName = '';
    let emailSentTo = '';

    // Determine recipient based on logged-in user role
    if (normalizedRole === Enum.CLIENT.toLowerCase()) {
      // Client role: Send to vendor if applicant has vendor_id, otherwise send to admin

      // First, try to find the applicant to get vendor_id
      let vendorId = null;

      if (applicantId && mongoose.Types.ObjectId.isValid(applicantId)) {
        const applicant = await jobApplication
          .findById(applicantId)
          .populate('vendor_id');
        if (applicant && applicant.vendor_id) {
          vendorId = applicant.vendor_id;
        }
      }

      if (vendorId) {
        // Send to vendor
        const vendorUser = await User.findById(vendorId).populate(
          'vendorProfileId'
        );
        if (vendorUser && vendorUser.email) {
          recipientEmail = vendorUser.email;
          recipientName = vendorUser.firstName
            ? `${vendorUser.firstName} ${vendorUser.lastName || ''}`
            : vendorUser.userName || 'Vendor';
          emailSentTo = 'vendor';
        } else {
          // Vendor not found or no email, send to admin
          const adminRole = await getRoleByNameService(Enum.ADMIN);
          if (adminRole) {
            const adminUser = await User.findOne({
              roleId: adminRole._id,
              isDeleted: false,
              isActive: true,
              email: { $exists: true, $ne: '' },
            });
            if (adminUser) {
              recipientEmail = adminUser.email;
              recipientName = adminUser.firstName
                ? `${adminUser.firstName} ${adminUser.lastName || ''}`
                : adminUser.userName || 'Admin';
              emailSentTo = 'admin';
            }
          }
        }
      } else {
        // No vendor_id, send to admin
        const adminRole = await getRoleByNameService(Enum.ADMIN);
        if (adminRole) {
          const adminUser = await User.findOne({
            roleId: adminRole._id,
            isDeleted: false,
            isActive: true,
            email: { $exists: true, $ne: '' },
          });
          if (adminUser) {
            recipientEmail = adminUser.email;
            recipientName = adminUser.firstName
              ? `${adminUser.firstName} ${adminUser.lastName || ''}`
              : adminUser.userName || 'Admin';
            emailSentTo = 'admin';
          }
        }

        // If no admin found, fall back to HR_EMAIL
        if (!recipientEmail) {
          recipientEmail = process.env.HR_EMAIL;
          recipientName = 'Admin';
          emailSentTo = 'admin (HR_EMAIL)';
        }
      }
    } else if (normalizedRole === Enum.VENDOR.toLowerCase()) {
      // Vendor role: Send to applicant
      recipientEmail = applicantEmail;
      recipientName = applicantName;
      emailSentTo = 'applicant';
    } else {
      // For admin/hr or other roles, send to applicant by default
      recipientEmail = applicantEmail;
      recipientName = applicantName;
      emailSentTo = 'applicant';
    }

    // Validate recipient email
    if (!recipientEmail) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Unable to determine recipient email address'
      );
    }

    // Add recipient name placeholder
    emailDescription = emailDescription.replace(
      /{{recipientName}}/g,
      recipientName
    );
    emailSubject = emailSubject.replace(/{{recipientName}}/g, recipientName);

    // Send email
    const emailResult = await sendingEmailHelper({
      email_to: [recipientEmail],
      subject: emailSubject,
      description: emailDescription,
    });

    if (!emailResult || !emailResult.success) {
      logger.error(
        `Failed to send applicant status email to ${recipientEmail}`
      );
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to send email: ${emailResult?.error || 'Unknown error'}`
      );
    }

    logger.info(
      `Applicant status email sent successfully to ${recipientEmail} (${emailSentTo}) by ${userRole}`
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Email sent successfully to ${emailSentTo}`,
      {
        sentTo: emailSentTo,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        templateType: templateType,
        applicantStatus: applicantStatus,
        senderRole: userRole,
      }
    );
  } catch (error) {
    logger.error(`Failed to send applicant status email: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send applicant status email: ${error.message}`
    );
  }
};
