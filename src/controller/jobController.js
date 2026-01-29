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
import xlsx from 'xlsx';

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
        // Include sharedBy parameter to track that the job creator sent this notification
        const sharedById = job.addedBy?.toString() || '';

        for (const applicant of matchingApplicants) {
          try {
            const applicationUrl = `${baseUrl}vendor/email-check-apply?jobId=${jobIdForUrl}&sharedBy=${sharedById}`;
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
        'Invalid job ID.'
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
      limit: limitParam,
      pageSize,
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

    // Support both 'limit' and 'pageSize' parameters
    const limit = limitParam || pageSize || 10;
    const query = { isDeleted: false };

    const user = req.user || {};
    const userRole = user?.role?.toLowerCase(); // Normalize role to lowercase

    // Client can ONLY see their own jobs - no other filters apply
    if (userRole === Enum.CLIENT) {
      query.addedBy = new mongoose.Types.ObjectId(user.id);
    } else if (userRole === Enum.VENDOR) {
      const vendorId = new mongoose.Types.ObjectId(user.id);

      // Vendor can see: their own jobs OR jobs they were emailed about
      query.$or = [{ addedBy: vendorId }, { emailedVendors: vendorId }];
    } else if (posted_by_role && userRole === Enum.ADMIN) {
      // Only admin can filter by posted_by_role (case-insensitive)
      const normalizedRole = posted_by_role.toLowerCase();
      const usersWithRole = await User.find(
        { role: { $regex: new RegExp(`^${normalizedRole}$`, 'i') } },
        '_id'
      ).lean();

      const userIds = usersWithRole.map((u) => u._id);
      query.addedBy = { $in: userIds };
    }

    // filterBy only applies to admin and vendor users, not clients
    if (filterBy && userRole !== Enum.CLIENT) {
      const normalizedFilterBy = filterBy.toLowerCase();
      if (normalizedFilterBy === Enum.VENDOR) {
        // Get vendor users (by roleId OR role string field)
        const vendorRole = await getRoleByNameService(Enum.VENDOR);
        const vendorUsers = await User.find(
          {
            $or: [
              ...(vendorRole ? [{ roleId: vendorRole._id }] : []),
              { role: { $regex: new RegExp(`^${Enum.VENDOR}$`, 'i') } },
            ],
            isDeleted: false,
          },
          '_id'
        ).lean();
        const vendorIds = vendorUsers.map((v) => v._id);

        // Get admin users (for backward compatibility - admin jobs without jobModule)
        const adminRole = await getRoleByNameService(Enum.ADMIN);
        const adminUsers = await User.find(
          {
            $or: [
              ...(adminRole ? [{ roleId: adminRole._id }] : []),
              { role: { $regex: new RegExp(`^${Enum.ADMIN}$`, 'i') } },
            ],
            isDeleted: false,
          },
          '_id'
        ).lean();
        const adminIds = adminUsers.map((a) => a._id);

        if (userRole === Enum.VENDOR) {
          // For vendor: show vendor jobs OR jobs with jobModule='vendor' OR admin jobs without jobModule OR jobs they were emailed about
          const vendorId = new mongoose.Types.ObjectId(user.id);
          query.$or = [
            { addedBy: { $in: vendorIds } },
            { jobModule: 'vendor' },
            {
              addedBy: { $in: adminIds },
              jobModule: { $in: [null, 'vendor'] },
            },
            { emailedVendors: vendorId },
          ];
        } else {
          // For admin: show vendor-created jobs OR jobs with jobModule='vendor' OR admin jobs without jobModule (default to vendor)
          query.$or = [
            { addedBy: { $in: vendorIds } },
            { jobModule: 'vendor' },
            {
              addedBy: { $in: adminIds },
              jobModule: { $in: [null, 'vendor'] },
            },
          ];
        }
      } else if (normalizedFilterBy === Enum.CLIENT) {
        // Get client users (by roleId OR role string field)
        const clientRole = await getRoleByNameService(Enum.CLIENT);
        const clientUsers = await User.find(
          {
            $or: [
              ...(clientRole ? [{ roleId: clientRole._id }] : []),
              { role: { $regex: new RegExp(`^${Enum.CLIENT}$`, 'i') } },
            ],
            isDeleted: false,
          },
          '_id'
        ).lean();
        const clientIds = clientUsers.map((v) => v._id);

        // Get admin users (for backward compatibility - admin jobs without jobModule)
        const adminRole = await getRoleByNameService(Enum.ADMIN);
        const adminUsers = await User.find(
          {
            $or: [
              ...(adminRole ? [{ roleId: adminRole._id }] : []),
              { role: { $regex: new RegExp(`^${Enum.ADMIN}$`, 'i') } },
            ],
            isDeleted: false,
          },
          '_id'
        ).lean();
        const adminIds = adminUsers.map((a) => a._id);

        if (userRole === Enum.VENDOR) {
          // For vendor filtering by client: show client jobs OR admin jobs with jobModule='client' they were emailed about
          const vendorId = new mongoose.Types.ObjectId(user.id);
          query.$or = [
            {
              $and: [
                {
                  $or: [
                    { addedBy: { $in: clientIds } },
                    { jobModule: 'client' },
                    {
                      addedBy: { $in: adminIds },
                      jobModule: { $in: [null, 'client'] },
                    },
                  ],
                },
                { emailedVendors: vendorId },
              ],
            },
          ];
        } else {
          // For admin: show client-created jobs OR jobs with jobModule='client' OR admin jobs without jobModule
          query.$or = [
            { addedBy: { $in: clientIds } },
            { jobModule: 'client' },
            {
              addedBy: { $in: adminIds },
              jobModule: { $in: [null, 'client'] },
            },
          ];
        }
      }
    }

    if (search && typeof search === 'string') {
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '');
      const flexiblePattern = cleanSearch.split('').join('[-_\\s]*');
      const regex = new RegExp(flexiblePattern, 'i');

      const searchCondition = {
        $or: [
          { job_subject: { $regex: regex } },
          { job_type: { $regex: regex } },
        ],
      };

      if (userRole === Enum.VENDOR && query.$or) {
        // Vendor with existing $or (from vendor filter logic)
        query.$and = [
          {
            $or: query.$or,
          },
          searchCondition,
        ];
        delete query.$or;
      } else if (query.$or) {
        // Other roles with existing $or - combine with search
        query.$and = [
          {
            $or: query.$or,
          },
          searchCondition,
        ];
        delete query.$or;
      } else {
        // No existing $or - just add search
        query.$or = searchCondition.$or;
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

    // Return empty array instead of 404 when no jobs found
    if (!result || result?.item?.length === 0) {
      logger.info(`No jobs found for the given criteria`);
      return HandleResponse(res, true, StatusCodes.OK, `No jobs found`, {
        item: [],
        totalRecords: 0,
        currentPage: parseInt(page),
        totalPages: 0,
        limit: parseInt(limit),
      });
    }

    if (userRole === Enum.VENDOR && result?.item) {
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
    if (userRole === Enum.ADMIN && result?.item) {
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

// View invited/emailed applicants for a job
export const viewInvitedApplicants = async (req, res) => {
  try {
    const user = req.user || {};
    const userRole = user?.role?.toLowerCase();
    const { jobId } = req.params;
    const { page = 1, limit = 10, search } = req.query;

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Valid Job ID is required'
      );
    }

    // Fetch job details
    const job = await fetchJobService(jobId);
    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    // Role-based access control
    if (userRole === Enum.VENDOR) {
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
          'You can only view invited applicants for your own jobs or jobs you were emailed about'
        );
      }
    } else if (userRole === Enum.CLIENT) {
      if (job.addedBy.toString() !== user.id) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only view invited applicants for your own jobs'
        );
      }
    }
    // Admin can view all

    // Get emailed applicant IDs
    const emailedApplicantIds = job.emailedApplicants || [];

    if (emailedApplicantIds.length === 0) {
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'No applicants have been invited for this job',
        {
          applicants: [],
          totalRecords: 0,
          currentPage: parseInt(page),
          totalPages: 0,
          limit: parseInt(limit),
        }
      );
    }

    // Build query for applicants
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let applicantQuery = {
      _id: { $in: emailedApplicantIds },
      isDeleted: false,
    };

    // Add search filter if provided
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      applicantQuery.$or = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
        { appliedSkills: searchRegex },
      ];
    }

    // Get total count
    const totalCount = await Applicant.countDocuments(applicantQuery);

    // Fetch applicants with pagination
    const applicants = await Applicant.find(applicantQuery)
      .select(
        'name email phone appliedSkills otherSkills currentCompanyName currentCompanyDesignation totalExperience currentCity state workPreference noticePeriod profilePicture resumeUrl'
      )
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Check which invited applicants have applied to this job
    const applicantEmails = applicants.map((a) => a.email);
    const existingApplications = await jobApplication
      .find({
        job_id: jobId,
        email: { $in: applicantEmails },
        isDeleted: false,
      })
      .select('email status interviewStage score')
      .lean();

    // Create map for application status
    const applicationMap = new Map(
      existingApplications.map((app) => [
        app.email,
        {
          status: app.status,
          interviewStage: app.interviewStage,
          score: app.score,
        },
      ])
    );

    // Add application status to each applicant
    const applicantsWithStatus = applicants.map((applicant) => ({
      ...applicant,
      hasApplied: applicationMap.has(applicant.email),
      applicationStatus: applicationMap.get(applicant.email) || null,
    }));

    logger.info(
      `Invited applicants for job ${jobId} ${Message.FETCH_SUCCESSFULLY}`
    );

    return HandleResponse(res, true, StatusCodes.OK, undefined, {
      applicants: applicantsWithStatus,
      totalRecords: totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      limit: parseInt(limit),
      job: {
        _id: job._id,
        job_id: job.job_id,
        job_subject: job.job_subject,
      },
    });
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} fetch invited applicants: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch invited applicants`
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

    if (!email) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Email is required.'
      );
    }

    if (!jobId) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Job ID is required.'
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
        'Email is required.'
      );
    }

    if (!jobId) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Job ID is required.'
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
          'Invalid job ID.'
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

    // Search functionality with full name matching
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      // Split search term into words for full name matching
      const searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Build search conditions
      const searchConditions = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { 'name.middleName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
        { 'phone.whatsappNumber': searchRegex },
      ];

      // For full name searches (multiple words), also try matching across firstName and lastName
      if (searchWords.length > 1) {
        const firstNameRegex = new RegExp(
          searchWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );
        const lastNameRegex = new RegExp(
          searchWords
            .slice(1)
            .join(' ')
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );

        searchConditions.push({
          $and: [
            { 'name.firstName': firstNameRegex },
            { 'name.lastName': lastNameRegex },
          ],
        });

        // Also try reverse: lastName contains first word, firstName contains rest
        if (searchWords.length === 2) {
          searchConditions.push({
            $and: [
              { 'name.lastName': firstNameRegex },
              { 'name.firstName': lastNameRegex },
            ],
          });
        }
      }

      // Combine search with existing query conditions
      const existingConditions = {};
      Object.keys(query).forEach((key) => {
        if (!['$or', '$and', 'isDeleted'].includes(key)) {
          existingConditions[key] = query[key];
          delete query[key];
        }
      });

      query.$and = [
        ...(Object.keys(existingConditions).length > 0
          ? [existingConditions]
          : []),
        ...(query.$and || []),
        { $or: searchConditions },
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
          select:
            'job_id job_subject job_type job_location required_skills addedBy',
          populate: {
            path: 'addedBy',
            model: 'user',
            select: 'firstName lastName email vendorProfileId',
            populate: {
              path: 'vendorProfileId',
              select: 'company_name',
            },
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
    const userRole = user?.role?.toLowerCase(); // Normalize role to lowercase
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
        'Job ID is required.'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid job ID.'
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

    if (userRole === Enum.VENDOR) {
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
    } else if (userRole === Enum.CLIENT) {
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

    // Search functionality with full name matching
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      // Split search term into words for full name matching
      const searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Build search conditions
      const searchConditions = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { 'name.middleName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
        { 'phone.whatsappNumber': searchRegex },
      ];

      // For full name searches (multiple words), also try matching across firstName and lastName
      if (searchWords.length > 1) {
        const firstNameRegex = new RegExp(
          searchWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );
        const lastNameRegex = new RegExp(
          searchWords
            .slice(1)
            .join(' ')
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );

        searchConditions.push({
          $and: [
            { 'name.firstName': firstNameRegex },
            { 'name.lastName': lastNameRegex },
          ],
        });

        // Also try reverse: lastName contains first word, firstName contains rest
        if (searchWords.length === 2) {
          searchConditions.push({
            $and: [
              { 'name.lastName': firstNameRegex },
              { 'name.firstName': lastNameRegex },
            ],
          });
        }
      }

      // Combine search with existing query conditions
      const existingConditions = {};
      Object.keys(query).forEach((key) => {
        if (!['$or', '$and', 'isDeleted'].includes(key)) {
          existingConditions[key] = query[key];
          delete query[key];
        }
      });

      query.$and = [
        ...(Object.keys(existingConditions).length > 0
          ? [existingConditions]
          : []),
        ...(query.$and || []),
        { $or: searchConditions },
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
          'Invalid job ID.'
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

    // Search functionality for applicant name and job title
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      // Split search term into words for full name matching
      const searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Get job IDs that match the search term in job_subject
      // Only search in jobs that belong to this client
      let clientJobIdsForSearch = [];
      if (query.job_id) {
        if (query.job_id.$in) {
          clientJobIdsForSearch = query.job_id.$in;
        } else if (mongoose.Types.ObjectId.isValid(query.job_id)) {
          clientJobIdsForSearch = [query.job_id];
        }
      }

      const jobSearchQuery = {
        job_subject: { $regex: searchRegex },
        isDeleted: false,
      };

      // Limit job search to client's jobs
      if (clientJobIdsForSearch.length > 0) {
        jobSearchQuery._id = { $in: clientJobIdsForSearch };
      } else {
        // If no specific job_id filter, search in all client's jobs
        jobSearchQuery.addedBy = user.id;
      }

      const matchingJobs = await jobs.find(jobSearchQuery, '_id').lean();

      const matchingJobIds = matchingJobs.map((job) => job._id);

      // Build search conditions
      const searchConditions = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { 'name.middleName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
        { 'phone.whatsappNumber': searchRegex },
      ];

      // Add job title search if matching jobs found
      if (matchingJobIds.length > 0) {
        searchConditions.push({ job_id: { $in: matchingJobIds } });
      }

      // For full name searches (multiple words), also try matching across firstName and lastName
      if (searchWords.length > 1) {
        // Match if firstName contains first word AND lastName contains any other word
        const firstNameRegex = new RegExp(
          searchWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );
        const lastNameRegex = new RegExp(
          searchWords
            .slice(1)
            .join(' ')
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );

        searchConditions.push({
          $and: [
            { 'name.firstName': firstNameRegex },
            { 'name.lastName': lastNameRegex },
          ],
        });

        // Also try reverse: lastName contains first word, firstName contains rest
        if (searchWords.length === 2) {
          searchConditions.push({
            $and: [
              { 'name.lastName': firstNameRegex },
              { 'name.firstName': lastNameRegex },
            ],
          });
        }
      }

      // Combine search with existing query conditions using $and
      // Extract existing conditions (job_id, status, appliedSkills, score, etc.)
      const existingConditions = {};
      Object.keys(query).forEach((key) => {
        if (!['$or', '$and', 'isDeleted'].includes(key)) {
          existingConditions[key] = query[key];
          delete query[key];
        }
      });

      // Build final query with $and to combine existing conditions with search
      query.$and = [
        ...(Object.keys(existingConditions).length > 0
          ? [existingConditions]
          : []),
        ...(query.$and || []),
        { $or: searchConditions },
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

    // Format applicants with referredBy field to show who sent the email
    const formattedApplicants = (applicantsResult?.item || []).map((app) => {
      // Determine referredBy: vendor_id takes precedence if exists, otherwise client_id
      let referredBy = null;
      if (app.vendor_id) {
        referredBy = {
          type: 'vendor',
          _id: app.vendor_id._id,
          name: `${app.vendor_id.firstName || ''} ${
            app.vendor_id.lastName || ''
          }`.trim(),
          email: app.vendor_id.email,
          companyName: app.vendor_id.vendorProfileId?.company_name || null,
        };
      } else if (app.client_id) {
        referredBy = {
          type: 'client',
          _id: app.client_id._id,
          name: `${app.client_id.firstName || ''} ${
            app.client_id.lastName || ''
          }`.trim(),
          email: app.client_id.email,
          companyName: app.client_id.vendorProfileId?.company_name || null,
        };
      }

      return {
        ...(app.toObject ? app.toObject() : app),
        referredBy,
      };
    });

    const responseData = {
      applicants: formattedApplicants,
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
        'Invalid job ID.'
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
    // Include sharedBy parameter to track who sent the email (vendor or client)
    const applicantApplicationUrl = `${baseUrl}vendor/email-check-apply?jobId=${jobIdForUrl}&sharedBy=${user.id}`; // Applicants redirect to application

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
              error: 'Applicant not found.',
            });
            continue;
          }

          if (!applicant.isActive) {
            emailStatus.applicants.failed++;
            emailStatus.applicants.errors.push({
              applicantId,
              error: 'Please activate the user before sending the email.',
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
      `${totalSent === 1 ? 'Email' : 'Emails'} sent: ${totalSent} successful, ${totalFailed} failed`,
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
    const { search, type, jobId } = req.query; // type: 'vendor', 'applicant', 'client', or 'all'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const result = {
      vendors: [],
      applicants: [],
      clients: [],
    };

    // Fetch job details if jobId is provided (for skill matching)
    let jobRequiredSkills = [];
    let alreadyAppliedEmails = [];
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      try {
        const job = await fetchJobService(jobId);
        if (job && job.required_skills && Array.isArray(job.required_skills)) {
          jobRequiredSkills = job.required_skills.map((skill) =>
            skill.trim().toLowerCase()
          );
        }

        // Fetch emails of applicants who have already applied for this job
        const existingApplications = await jobApplication
          .find({
            job_id: new mongoose.Types.ObjectId(jobId),
            isDeleted: false,
          })
          .select('email')
          .lean();
        alreadyAppliedEmails = existingApplications
          .map((app) => app.email?.toLowerCase())
          .filter(Boolean);
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

    // Fetch clients if type is 'client' or 'all'
    if (type === 'client' || type === 'all') {
      try {
        const clientRole = await getRoleByNameService(Enum.CLIENT);
        if (clientRole) {
          let clientQuery = {
            roleId: clientRole._id,
            isDeleted: false,
            isActive: true,
          };

          // Add search filter if provided
          if (search && typeof search === 'string') {
            const searchRegex = new RegExp(
              search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i'
            );
            clientQuery.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex },
              { userName: searchRegex },
            ];
          }

          const clients = await pagination({
            Schema: User,
            page,
            limit,
            query: clientQuery,
            sort: { createdAt: -1 },
            populate: {
              path: 'vendorProfileId',
              select: 'company_name company_email',
            },
          });

          // Format client data
          result.clients = (clients.item || []).map((client) => ({
            _id: client._id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            userName: client.userName,
            companyName: client.vendorProfileId?.company_name || '',
            companyEmail: client.vendorProfileId?.company_email || '',
          }));
        }
      } catch (clientErr) {
        logger.error(`Error fetching clients: ${clientErr.message}`);
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

        // Exclude applicants who have already applied for this job
        if (jobId && alreadyAppliedEmails.length > 0) {
          // Use case-insensitive regex to exclude already applied emails
          applicantQuery.$nor = alreadyAppliedEmails.map((email) => ({
            email: new RegExp(
              `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            ),
          }));
        }

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
        if (search && typeof search === 'string' && search.trim()) {
          const searchTerm = search.trim();
          const searchRegex = new RegExp(
            searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
          );

          // Split search term into words for full name matching
          const searchWords = searchTerm
            .split(/\s+/)
            .filter((word) => word.length > 0);

          // Build search conditions
          const searchConditions = [
            { 'name.firstName': searchRegex },
            { 'name.lastName': searchRegex },
            { 'name.middleName': searchRegex },
            { email: searchRegex },
            { 'phone.phoneNumber': searchRegex },
          ];

          // For full name searches (multiple words), also try matching across firstName and lastName
          if (searchWords.length > 1) {
            const firstNameRegex = new RegExp(
              searchWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i'
            );
            const lastNameRegex = new RegExp(
              searchWords
                .slice(1)
                .join(' ')
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i'
            );

            searchConditions.push({
              $and: [
                { 'name.firstName': firstNameRegex },
                { 'name.lastName': lastNameRegex },
              ],
            });

            // Also try reverse: lastName contains first word, firstName contains rest
            if (searchWords.length === 2) {
              searchConditions.push({
                $and: [
                  { 'name.lastName': firstNameRegex },
                  { 'name.firstName': lastNameRegex },
                ],
              });
            }
          }

          if (applicantQuery.$or) {
            // If $or already exists (from skill matching), combine with $and
            applicantQuery.$and = [
              { $or: applicantQuery.$or },
              { $or: searchConditions },
            ];
            delete applicantQuery.$or;
          } else {
            applicantQuery.$or = searchConditions;
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
      `Recipients fetched for user ${user.id}: ${result.vendors.length} vendors, ${result.clients.length} clients, ${result.applicants.length} applicants`
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Recipients fetched successfully',
      result
    );
  } catch (error) {
    logger.error(`Failed to fetch recipients: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to fetch recipients: ${error.message}`
    );
  }
};

// Send applicant status email based on logged-in user role
// - Client role: Send to vendor (if applicant has vendor_id) or admin (if no vendor)
// - Vendor role: Send to applicant
// Get job applications based on role (client/vendor) with filters
export const getJobApplicationsByRole = async (req, res) => {
  try {
    const user = req.user || {};
    const userRole = user?.role?.toLowerCase(); // Normalize user role to lowercase
    const {
      role,
      job_id,
      applicant_id,
      vendor_id,
      client_id,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate role parameter
    if (!role || !['client', 'vendor'].includes(role.toLowerCase())) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid role parameter. Must be "client" or "vendor"'
      );
    }

    const normalizedRole = role.toLowerCase();
    const query = { isDeleted: false };

    // Role-based authorization
    // Admin can see all data
    // Client can see applications for jobs they created (using job.addedBy)
    // Vendor can see applications where they are the vendor (vendor_id matches)
    if (userRole === Enum.ADMIN) {
      // Admin can see all - no additional filter needed
    } else if (userRole === Enum.CLIENT) {
      // Client can see applications for jobs they created
      // First, get all job IDs created by this client
      const clientJobs = await jobs
        .find({ addedBy: user.id, isDeleted: false }, '_id')
        .lean();
      const jobIds = clientJobs.map((job) => job._id);

      if (jobIds.length === 0) {
        return HandleResponse(
          res,
          true,
          StatusCodes.OK,
          'No job applications found',
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
      query.job_id = { $in: jobIds };
    } else if (userRole === Enum.VENDOR) {
      // Vendor can see applications where they are the vendor
      query.vendor_id = new mongoose.Types.ObjectId(user.id);
    } else {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'You do not have permission to access this resource'
      );
    }

    // Apply job_id filter
    if (job_id) {
      if (mongoose.Types.ObjectId.isValid(job_id)) {
        const jobObjectId = new mongoose.Types.ObjectId(job_id);
        // For CLIENT, verify the job belongs to them
        if (userRole === Enum.CLIENT) {
          const job = await jobs.findOne({
            _id: jobObjectId,
            addedBy: user.id,
            isDeleted: false,
          });
          if (!job) {
            return HandleResponse(
              res,
              false,
              StatusCodes.FORBIDDEN,
              'You can only view applications for your own jobs'
            );
          }
        }
        query.job_id = jobObjectId;
      } else {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid job_id format'
        );
      }
    }

    // Apply applicant_id filter
    if (applicant_id) {
      if (mongoose.Types.ObjectId.isValid(applicant_id)) {
        // Search by applicant's email or _id in jobApplication
        const applicant = await Applicant.findById(applicant_id);
        if (applicant) {
          query.email = applicant.email;
        } else {
          return HandleResponse(
            res,
            false,
            StatusCodes.NOT_FOUND,
            'Applicant not found.'
          );
        }
      } else {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid applicant_id format'
        );
      }
    }

    // Filter by vendor_id - Admin and Client can use this filter
    // Client can filter by vendor to see which vendor submitted which applicants
    if (vendor_id && (userRole === Enum.ADMIN || userRole === Enum.CLIENT)) {
      if (mongoose.Types.ObjectId.isValid(vendor_id)) {
        query.vendor_id = new mongoose.Types.ObjectId(vendor_id);
      } else {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid vendor_id format'
        );
      }
    }

    // Filter by client_id - Admin and Vendor can use this filter
    // Vendor can filter by client to see applicants for jobs from a specific client
    if (client_id && (userRole === Enum.ADMIN || userRole === Enum.VENDOR)) {
      if (mongoose.Types.ObjectId.isValid(client_id)) {
        // Get jobs created by this client and filter by those job IDs
        const clientJobsForFilter = await jobs
          .find({ addedBy: client_id, isDeleted: false }, '_id')
          .lean();
        const clientJobIds = clientJobsForFilter.map((job) => job._id);

        if (clientJobIds.length === 0) {
          return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            'No job applications found for this client',
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

        // If vendor already has job_id filter from their own applications, intersect with client jobs
        if (userRole === Enum.VENDOR) {
          // Vendor is filtering by client - only show applications for jobs created by that client
          // that the vendor has submitted
          query.job_id = { $in: clientJobIds };
        } else {
          query.job_id = { $in: clientJobIds };
        }
      } else {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid client_id format'
        );
      }
    }

    if (status) {
      // Case-insensitive status filter
      query.status = {
        $regex: new RegExp(
          `^${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        ),
      };
    }

    // Search functionality for applicant name and job title
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      // Split search term into words for full name matching
      const searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Get job IDs that match the search term in job_subject
      const matchingJobs = await jobs
        .find(
          {
            job_subject: { $regex: searchRegex },
            isDeleted: false,
          },
          '_id'
        )
        .lean();

      const matchingJobIds = matchingJobs.map((job) => job._id);

      // Build search conditions
      const searchConditions = [
        { 'name.firstName': searchRegex },
        { 'name.lastName': searchRegex },
        { 'name.middleName': searchRegex },
        { email: searchRegex },
        { 'phone.phoneNumber': searchRegex },
      ];

      // Add job title search if matching jobs found
      if (matchingJobIds.length > 0) {
        searchConditions.push({ job_id: { $in: matchingJobIds } });
      }

      // For full name searches (multiple words), also try matching across firstName and lastName
      if (searchWords.length > 1) {
        // Match if firstName contains first word AND lastName contains any other word
        // or vice versa
        const firstNameRegex = new RegExp(
          searchWords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );
        const lastNameRegex = new RegExp(
          searchWords
            .slice(1)
            .join(' ')
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );

        searchConditions.push({
          $and: [
            { 'name.firstName': firstNameRegex },
            { 'name.lastName': lastNameRegex },
          ],
        });

        // Also try reverse: lastName contains first word, firstName contains rest
        if (searchWords.length === 2) {
          searchConditions.push({
            $and: [
              { 'name.lastName': firstNameRegex },
              { 'name.firstName': lastNameRegex },
            ],
          });
        }
      }

      // Check if there are existing query conditions that might conflict
      // If query has direct field assignments (not $or/$and), we need to use $and
      const hasDirectFields = Object.keys(query).some(
        (key) => !['$or', '$and', 'isDeleted'].includes(key)
      );

      if (hasDirectFields) {
        // Use $and to combine existing conditions with search
        const directFields = {};
        Object.keys(query).forEach((key) => {
          if (!['$or', '$and', 'isDeleted'].includes(key)) {
            directFields[key] = query[key];
            delete query[key];
          }
        });

        query.$and = [
          ...(Object.keys(directFields).length > 0 ? [directFields] : []),
          ...(query.$and || []),
          { $or: searchConditions },
        ];
      } else {
        // No direct fields, can use $or directly
        if (query.$or) {
          // If $or already exists, combine with $and
          query.$and = [{ $or: query.$or }, { $or: searchConditions }];
          delete query.$or;
        } else {
          query.$or = searchConditions;
        }
      }
    }

    // Fetch job applications with pagination
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
          select: 'job_id job_subject job_type job_location addedBy',
          populate: {
            path: 'addedBy',
            model: 'user',
            select: 'firstName lastName email role roleId vendorProfileId',
            populate: [
              {
                path: 'vendorProfileId',
                select: 'company_name',
              },
              {
                path: 'roleId',
                select: 'name',
              },
            ],
          },
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
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'No job applications found',
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

    // Format response based on role
    let formattedApplications = [];

    if (normalizedRole === 'client') {
      // Client view: jobid, vendor, applicant name, status
      formattedApplications = result.item.map((app) => {
        const appObj = app.toObject ? app.toObject() : app;

        // Get vendor name - first try vendor_id, then fallback to job creator if they are a vendor
        let vendorName = null;
        let vendorCompany = null;
        let vendorId = null;

        // Check if vendor_id is populated (has _id property meaning it's a populated object)
        if (
          appObj.vendor_id &&
          typeof appObj.vendor_id === 'object' &&
          appObj.vendor_id._id
        ) {
          // vendor_id is populated
          vendorId = appObj.vendor_id._id;
          const firstName = appObj.vendor_id.firstName || '';
          const lastName = appObj.vendor_id.lastName || '';
          vendorName =
            `${firstName} ${lastName}`.trim() || appObj.vendor_id.email || null;
          vendorCompany =
            appObj.vendor_id.vendorProfileId?.company_name || null;
        } else if (
          appObj.job_id?.addedBy &&
          typeof appObj.job_id.addedBy === 'object' &&
          appObj.job_id.addedBy._id
        ) {
          // Fallback to job creator if they are a vendor
          const jobCreator = appObj.job_id.addedBy;
          if (jobCreator.role === Enum.VENDOR) {
            vendorId = jobCreator._id;
            const firstName = jobCreator.firstName || '';
            const lastName = jobCreator.lastName || '';
            vendorName =
              `${firstName} ${lastName}`.trim() || jobCreator.email || null;
            vendorCompany = jobCreator.vendorProfileId?.company_name || null;
          }
        }

        // Get applicant name
        const applicantName =
          `${appObj.name?.firstName || ''} ${
            appObj.name?.lastName || ''
          }`.trim() || null;

        return {
          _id: appObj._id,
          job_id: appObj.job_id?.job_id || null,
          job_subject: appObj.job_id?.job_subject || null,
          vendor: {
            _id: vendorId,
            name: vendorName,
            company_name: vendorCompany,
          },
          applicant_name: applicantName,
          applicant_email: appObj.email,
          status: appObj.status,
          createdAt: appObj.createdAt,
        };
      });
    } else {
      // Vendor view: jobid, applicant name, state, client name, status
      formattedApplications = result.item.map((app) => {
        const appObj = app.toObject ? app.toObject() : app;

        // Get client name - first try job creator if they are a client, then fallback to client_id
        let clientName = null;
        let clientCompany = null;
        let clientId = null;

        // First check job creator - most reliable source for client info
        if (
          appObj.job_id?.addedBy &&
          typeof appObj.job_id.addedBy === 'object' &&
          appObj.job_id.addedBy._id
        ) {
          const jobCreator = appObj.job_id.addedBy;
          // Check role from both role field and roleId.name
          const creatorRole = (
            jobCreator.roleId?.name ||
            jobCreator.role ||
            ''
          ).toLowerCase();

          // Check if job creator is a client
          if (creatorRole === 'client') {
            clientId = jobCreator._id;
            const firstName = jobCreator.firstName || '';
            const lastName = jobCreator.lastName || '';
            clientName =
              `${firstName} ${lastName}`.trim() || jobCreator.email || null;
            clientCompany = jobCreator.vendorProfileId?.company_name || null;
          }
        }

        // If no client found from job creator, try client_id field
        if (
          !clientId &&
          appObj.client_id &&
          typeof appObj.client_id === 'object' &&
          appObj.client_id._id
        ) {
          clientId = appObj.client_id._id;
          const firstName = appObj.client_id.firstName || '';
          const lastName = appObj.client_id.lastName || '';
          clientName =
            `${firstName} ${lastName}`.trim() || appObj.client_id.email || null;
          clientCompany =
            appObj.client_id.vendorProfileId?.company_name || null;
        }

        // Note: If no client found, it means this is vendor's own job (no client involved)

        // Get applicant name
        const applicantName =
          `${appObj.name?.firstName || ''} ${
            appObj.name?.lastName || ''
          }`.trim() || null;

        return {
          _id: appObj._id,
          job_id: appObj.job_id?.job_id || null,
          job_subject: appObj.job_id?.job_subject || null,
          applicant_name: applicantName,
          applicant_email: appObj.email,
          state: appObj.state || null,
          status: appObj.status,
          client: {
            _id: clientId,
            name: clientName,
            company_name: clientCompany,
          },
          createdAt: appObj.createdAt,
        };
      });
    }

    logger.info(
      `Job applications by role (${normalizedRole}) ${Message.FETCH_SUCCESSFULLY}`
    );
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job applications ${Message.FETCH_SUCCESSFULLY}`,
      {
        role: normalizedRole,
        applications: formattedApplications,
        pagination: {
          totalCount: result.totalRecords,
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          limit: result.limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch job applications by role`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch job applications by role`
    );
  }
};

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
    const { getEmailTemplateByStatus } =
      await import('../services/emailTemplateService.js');
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
        const vendorUser =
          await User.findById(vendorId).populate('vendorProfileId');
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

/**
 * Download sample Excel template for job application import
 * GET /api/job/sample-application-import
 *
 * Required fields: First Name, Email, Phone Number, Job ID
 * Optional fields: Last Name, Middle Name, Applied Role, Current Company Designation, etc.
 */
export const downloadSampleApplicationImport = async (req, res) => {
  try {
    // Define Excel headers (matching the expected import format)
    const headers = [
      'First Name', // Required
      'Last Name', // Optional
      'Middle Name', // Optional
      'Email', // Required
      'Phone Number', // Required
      'WhatsApp Number', // Optional
      'Job ID', // Required - The job_id from the jobs collection
      'Applied Role', // Optional
      'Current Company Designation', // Optional
      'Current Company Name', // Optional
      'Total Experience', // Optional (in years)
      'Applied Skills', // Optional (comma-separated)
      'Other Skills', // Optional
      'Current Package', // Optional
      'Expected Package', // Optional
      'Notice Period', // Optional (in days)
      'Work Preference', // Optional (remote/hybrid/onsite/freelancer)
      'Gender', // Optional (male/female/other)
      'Qualification', // Optional
      'Current City', // Optional
      'State', // Optional
      'Country', // Optional
    ];

    // Sample data rows with example values
    const timestamp = Date.now();
    const phoneBase = String(timestamp).slice(-10);
    const phone1 = phoneBase.slice(0, 10).padStart(10, '9');
    const phone2 = String(Number(phone1) + 1);

    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Middle Name': '',
        Email: `john.doe_${timestamp}@example.com`,
        'Phone Number': phone1,
        'WhatsApp Number': phone1,
        'Job ID': 'JOB001', // Replace with actual job_id
        'Applied Role': 'Software Engineer',
        'Current Company Designation': 'Senior Developer',
        'Current Company Name': 'Tech Solutions Inc',
        'Total Experience': '5',
        'Applied Skills': 'JavaScript, React, Node.js, MongoDB',
        'Other Skills': 'Agile, Scrum',
        'Current Package': '800000',
        'Expected Package': '1000000',
        'Notice Period': '30',
        'Work Preference': 'remote',
        Gender: 'male',
        Qualification: 'B.Tech',
        'Current City': 'Mumbai',
        State: 'Maharashtra',
        Country: 'India',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Middle Name': 'Marie',
        Email: `jane.smith_${timestamp}@example.com`,
        'Phone Number': phone2,
        'WhatsApp Number': phone2,
        'Job ID': 'JOB001', // Replace with actual job_id
        'Applied Role': 'Full Stack Developer',
        'Current Company Designation': 'Developer',
        'Current Company Name': 'Digital Services Ltd',
        'Total Experience': '3',
        'Applied Skills': 'Python, Django, PostgreSQL, AWS',
        'Other Skills': 'Docker, Kubernetes',
        'Current Package': '600000',
        'Expected Package': '850000',
        'Notice Period': '15',
        'Work Preference': 'hybrid',
        Gender: 'female',
        Qualification: 'M.Tech',
        'Current City': 'Bangalore',
        State: 'Karnataka',
        Country: 'India',
      },
    ];

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(sampleData, { header: headers });

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 15 }, // Middle Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone Number
      { wch: 15 }, // WhatsApp Number
      { wch: 12 }, // Job ID
      { wch: 20 }, // Applied Role
      { wch: 25 }, // Current Company Designation
      { wch: 20 }, // Current Company Name
      { wch: 15 }, // Total Experience
      { wch: 40 }, // Applied Skills
      { wch: 20 }, // Other Skills
      { wch: 15 }, // Current Package
      { wch: 15 }, // Expected Package
      { wch: 15 }, // Notice Period
      { wch: 15 }, // Work Preference
      { wch: 10 }, // Gender
      { wch: 15 }, // Qualification
      { wch: 15 }, // Current City
      { wch: 15 }, // State
      { wch: 15 }, // Country
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sample Applications');

    // Generate Excel file buffer
    const excelBuffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    const filename = `sample_job_application_import_template.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info(`Sample job application import template downloaded`);
    return res.status(StatusCodes.OK).send(excelBuffer);
  } catch (error) {
    logger.error(
      `Failed to generate sample application import template: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to generate sample template: ${error.message}`
    );
  }
};
