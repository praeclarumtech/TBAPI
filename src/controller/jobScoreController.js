import {
  calculateJobScore,
  processResumeAndJD,
} from '../services/jobScoreService.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import jobApplication from '../models/jobApplicantionModel.js';
import Applicant from '../models/applicantModel.js';
import logger from '../loggers/logger.js';
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
import {
  deleteApplications,
  fetchJobsById,
  getApplicantionById,
  updateJobApplicantionStatus,
  updateStatusAndInterviewstage,
  createVendorData,
} from '../services/jobService.js';
import { applicantEnum, Enum } from '../utils/enum.js';
import User from '../models/userModel.js';
import {
  getAllusers,
  createUser,
  getUser,
  getUserByUserName,
  updateProfileById,
} from '../services/userService.js';
import { getRoleByNameService } from '../services/roleService.js';
import Vendor from '../models/vendorModel.js';
import Role from '../models/roleModel.js';
import bcrypt from 'bcryptjs';
import { sendingEmail as sendingEmailHelper } from '../helpers/commonFunction/handleEmail.js';
import { vendorRegistrationRequestTemplate } from '../utils/emailTemplates/emailTemplates.js';

export const scoreResume = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        req.fileValidationError
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

    if (resumeFile) fs.unlinkSync(resumeFile.path);
    if (jdFile) fs.unlinkSync(jdFile.path);

    logger.info(`${Message.RESUME_SCORED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `${Message.RESUME_SCORED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO}process resume scoring. ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO}process resume scoring.`
    );
  }
};

export const addJobApplication = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      logger.warn(Message.UPLOAD_FAILED);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `${Message.UPLOAD_FAILED}`
      );
    }

    const { job_id } = req.body;
    const resumeFile = req.files.resume?.[0];

    const job = await jobs.findOne({ job_id });

    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Job ${Message.NOT_FOUND}`
      );
    }

    const jdText = `jobsubject: ${
      job.job_subject
    }, jobdetails: ${job.job_details.replace(/<[^>]*>/g, '')}, jobtype: ${
      job.job_type
    }, job location: ${job.job_location}, ${job.job_type}, min experience: ${
      job.min_experience
    }, contractduration: ${job.contract_duration}, ${
      job.required_skills
    }, work preference :${job.work_preference}`;

    let resumeText;
    try {
      switch (resumeFile.mimetype) {
        case 'application/pdf':
          resumeText = await extractTextFromPDF(resumeFile.path);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          resumeText = await extractTextFromDocx(resumeFile.path);
          break;
        case 'application/msword':
          resumeText = await extractTextFromDoc(resumeFile.path);
          break;
        default:
          return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            Message.UNSUPPORTED_FILE
          );
      }
    } catch (extractError) {
      logger.error('Error extracting text:', extractError);
      throw new Error('Failed to extract text from resume');
    }

    const applicantData = parseResumeText(resumeText);
    if (!applicantData.email || !applicantData.phone.phoneNumber) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Could not extract email or phone from resume'
      );
    }

    const matchedSkills = await extractSkillsFromResume(resumeText);
    const role = await extractMatchingRoleFromResume(resumeText);

    const existingApplicant = await jobApplication.findOne({
      $or: [
        { email: applicantData.email },
        { 'phone.phoneNumber': applicantData.phone.phoneNumber },
      ],
      job_id: job._id,
    });

    if (existingApplicant) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'Applicant already applied for this job.'
      );
    }

    // Determine vendor_id and client_id based on logged-in user role
    const userRole = req.user?.role?.toLowerCase() || '';
    const isVendorSubmitting = userRole === Enum.VENDOR.toLowerCase();
    const isClientSubmitting = userRole === Enum.CLIENT.toLowerCase();

    const applicant = new jobApplication({
      ...applicantData,
      job_id: job._id,
      vendor_id: isVendorSubmitting ? req.user.id : null,
      client_id: isClientSubmitting ? req.user.id : null,
      otherSkills: matchedSkills,
      appliedRole: role,
      isActive: true,
      resumeUrl: '',
      addedBy: applicantEnum.GUEST,
      user_id: req.user?.id,
      score: calculateJobScore(resumeText, jdText),
    });

    if (resumeFile) fs.unlinkSync(resumeFile.path);
    await applicant.save();

    logger.info(`Application ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Application ${Message.ADDED_SUCCESSFULLY}`,
      {
        applicant,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add application.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add application.`
    );
  }
};

export const updateApplicantionStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const result = await updateJobApplicantionStatus(applicationId, status);

    if (result.modifiedCount === 0) {
      logger.warn(`Application ${Message.NOT_FOUND} with ID: ${applicationId}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Application ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Application status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Application status ${Message.UPDATED_SUCCESSFULLY}`,
      {
        applicationId,
        newStatus: status,
      }
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} update application status: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update application status`
    );
  }
};

export const fetchAppliedJobs = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { applications, pagination } = await fetchJobsById(
      userId,
      page,
      limit
    );

    if (!applications || applications.length === 0) {
      logger.error(`Applied jobs for this user ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applied jobs for this user ${Message.NOT_FOUND}`
      );
    }

    logger.info(`All jobs applications ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All jobs applications ${Message.FETCH_SUCCESSFULLY}`,
      { applications, pagination }
    );
  } catch (error) {
    logger.error(`Failed to fetch applied job IDs: ${error.message}`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applied job IDs.`
    );
  }
};

export const viewJobApplicantionsByVendor = async (req, res) => {
  try {
    const user = req.user || {};
    const userRole = user?.role?.toLowerCase(); // Normalize role to lowercase
    const { appliedSkills, filterBy } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };

    if (userRole === Enum.VENDOR) {
      const vendorId = new mongoose.Types.ObjectId(user.id);
      // Vendor can see applications for:
      // 1. Jobs they created (addedBy)
      // 2. Jobs they were emailed about (emailedVendors)
      // 3. Applications they submitted (vendor_id)
      const vendorJobs = await jobs.find({
        $or: [
          { addedBy: vendorId },
          { emailedVendors: vendorId }
        ],
        isDeleted: false
      }, '_id').lean();
      
      const jobIds = vendorJobs.map(job => job._id);
      query.$or = [
        { vendor_id: vendorId },
        { job_id: { $in: jobIds } }
      ];
    }
    if (userRole === Enum.CLIENT) {
      const jobIds = await jobs.find({ addedBy: user.id, isDeleted: false }, { _id: 1 }).lean();
      const jobIdList = jobIds.map((job) => job._id);
      query.job_id = { $in: jobIdList };
    }

    if (userRole === Enum.ADMIN && filterBy) {
      const normalizedFilterBy = filterBy.toLowerCase();
      if (normalizedFilterBy === Enum.VENDOR) {
        const vendorRole = await getRoleByNameService(Enum.VENDOR);
        const vendorUsers = await getAllusers(
          { roleId: vendorRole._id },
          { _id: 1 }
        );
        const vendorJobIds = await jobs
          .find({ addedBy: { $in: vendorUsers.map((u) => u._id) } }, { _id: 1 })
          .lean();
        query.job_id = { $in: vendorJobIds.map((job) => job._id) };
      } else if (normalizedFilterBy === Enum.CLIENT) {
        const clientRole = await getRoleByNameService(Enum.CLIENT);
        const clientUsers = await getAllusers(
          { roleId: clientRole._id },
          { _id: 1 }
        );
        console.log('clientUsers', clientUsers);
        const clientJobIds = await jobs
          .find({ addedBy: { $in: clientUsers.map((u) => u._id) } }, { _id: 1 })
          .lean();
        console.log('clientJobIds', clientJobIds);
        query.job_id = { $in: clientJobIds.map((job) => job._id) };
        console.log('query', query);
      }
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

    const totalCount = await jobApplication.countDocuments(query);

    const applications = await jobApplication
      .find(query)
      .populate({
        path: 'job_id',
        model: 'jobs',
        select: 'job_id job_subject addedBy',
        populate: {
          path: 'addedBy',
          model: 'user',
          select: 'firstName lastName role',
        },
      })
      .populate({
        path: 'vendor_id',
        model: 'user',
        select: 'firstName lastName email role vendorProfileId',
        populate: {
          path: 'vendorProfileId',
          select: 'company_name',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    logger.info(`Job applications ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job applications ${Message.FETCH_SUCCESSFULLY}`,
      {
        applications,
        pagination: {
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch applications.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applications.`
    );
  }
};

export const viewApplicantionsById = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    if (!applicationId) {
      logger.warn('Application ID not provided');
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Application ID is required'
      );
    }

    const applicant = await getApplicantionById(applicationId);

    if (!applicant) {
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Job application ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Job applications ${Message.FETCH_SUCCESSFULLY}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch Job applicantion by id`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicantion by id.`
    );
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No applicant ID(s) provided' });
    }

    const deleteApplicant = await deleteApplications(ids, { isDeleted: true });
    logger.info(`Applicantion ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicantion ${Message.DELETED_SUCCESSFULLY}`,
      deleteApplicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete applicantion.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete applicantion.`
    );
  }
};

export const updateApplicantStatus = async (req, res) => {
  try {
    const user = req.user || {};
    const userRole = user?.role?.toLowerCase(); // Normalize role to lowercase
    const applicantId = req.params.id;
    const { interviewStage, status } = req.body;

    const application = await jobApplication.findById(applicantId);
    if (!application || application.isDeleted) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Application not found'
      );
    }

    const job = await jobs.findById(application.job_id);
    if (!job) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Job not found for this application'
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
          'You can only update status for applications to your own jobs or client jobs you were emailed about'
        );
      }
    } else if (userRole === Enum.CLIENT) {
      if (job.addedBy.toString() !== user.id) {
        return HandleResponse(
          res,
          false,
          StatusCodes.FORBIDDEN,
          'You can only update status for applications to your own jobs'
        );
      }
    } else if (userRole !== Enum.ADMIN && userRole !== Enum.HR) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only clients, vendors, admins, and HR can update application status'
      );
    }

    const update = await updateStatusAndInterviewstage(applicantId, {
      interviewStage,
      status,
    });

    logger.info(`Applicant status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status ${Message.UPDATED_SUCCESSFULLY}`,
      update
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update applicant status.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant status.`
    );
  }
};

export const getVendorJobApplicantReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const result = await jobs.aggregate([
      {
        $group: {
          _id: '$addedBy',
          totalJobs: { $sum: 1 },
          jobIds: { $push: '$_id' },
          jobs: {
            $push: {
              job_id: '$_id',
              job_subject: '$job_subject',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'jobapplications',
          let: { jobIds: '$jobIds', vendorId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$job_id', '$$jobIds'] },
                    { $eq: ['$vendor_id', '$$vendorId'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$job_id',
                count: { $sum: 1 },
              },
            },
          ],
          as: 'applicantsPerJob',
        },
      },
      {
        $addFields: {
          totalApplicants: { $sum: '$applicantsPerJob.count' },
          jobs: {
            $map: {
              input: '$jobs',
              as: 'job',
              in: {
                $mergeObjects: [
                  '$$job',
                  {
                    applicantCount: {
                      $let: {
                        vars: {
                          matched: {
                            $first: {
                              $filter: {
                                input: '$applicantsPerJob',
                                as: 'a',
                                cond: { $eq: ['$$a._id', '$$job.job_id'] },
                              },
                            },
                          },
                        },
                        in: { $ifNull: ['$$matched.count', 0] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorDetails',
        },
      },
      { $unwind: { path: '$vendorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vendor_id: '$_id',
          vendorName: {
            $concat: [
              '$vendorDetails.firstName',
              ' ',
              '$vendorDetails.lastName',
            ],
          },
          totalJobs: 1,
          totalApplicants: 1,
          jobs: 1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const totalVendors = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalVendors / limit);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Vendor job-applicant report generated successfully',
      {
        totalVendors,
        totalPages,
        currentPage: page,
        data: result[0].data,
      }
    );
  } catch (error) {
    logger.error('Failed to generate vendor report', error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to generate vendor report'
    );
  }
};

const generateTemporaryPassword = () => {
  const length = 12;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
  let password = '';
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '@#$%&*'[Math.floor(Math.random() * 6)];

  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

export const addVendor = async (req, res) => {
  try {
    const {
      userName,
      email,
      firstName,
      lastName,
      whatsapp_number,
      vendor_linkedin_profile,
      company_name,
      company_email,
      company_phone_number,
      company_location,
      company_type,
      hire_resources,
      company_strength,
      company_linkedin_profile,
      company_website,
      state,
      city,
    } = req.body;

    if (!userName || !email) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Username and email are required'
      );
    }

    const existingUser = await getUser({ email });
    if (existingUser) {
      logger.warn(`User with email ${email} already exists`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `User with email ${email} already exists`
      );
    }

    const existingUserName = await getUserByUserName(userName);
    if (existingUserName) {
      logger.warn(`Username ${userName} already exists`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Username ${userName} already exists`
      );
    }

    const vendorRole = await Role.findOne({ name: Enum.VENDOR });
    if (!vendorRole) {
      logger.error('Vendor role not found');
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Vendor role not found'
      );
    }

    let isAdminFlag = false;
    let addedByUserId = null;
    let addedByRole = null;

    if (req.user && req.user._id) {
      addedByUserId = req.user._id;
      if (req.user.role) {
        const normalizedRole = req.user.role.toLowerCase();
        isAdminFlag = normalizedRole === Enum.ADMIN.toLowerCase();
        addedByRole = req.user.role;
      } else {
        const requesterUser = await User.findById(req.user._id).populate(
          'roleId'
        );
        if (requesterUser?.roleId?.name) {
          addedByRole = requesterUser.roleId.name;
          const normalizedRole = addedByRole.toLowerCase();
          isAdminFlag = normalizedRole === Enum.ADMIN.toLowerCase();
        }
      }
    } else {
      addedByRole = 'admin';
    }

    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await createUser({
      userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      roleId: vendorRole._id,
      firstName: firstName || company_name || 'Vendor',
      lastName: lastName || '',
      isActive: false,
      isAdmin: isAdminFlag,
      addedBy: addedByUserId,
      addedByRole: addedByRole,
      passwordChanged: false,
    });

    const vendorData = {
      userId: newUser._id,
      whatsapp_number: whatsapp_number || '',
      vendor_linkedin_profile: vendor_linkedin_profile || '',
      company_name: company_name || '',
      company_email: company_email ? company_email.toLowerCase() : '',
      company_phone_number: company_phone_number || '',
      company_location: company_location || '',
      company_type: company_type || 'both',
      hire_resources: hire_resources || 'all',
      company_strength: company_strength || '',
      company_linkedin_profile: company_linkedin_profile || '',
      company_website: company_website || '',
      type: Enum.VENDOR,
      addedBy: addedByUserId || null,
      addedByRole: addedByRole || null,
    };

    const newVendor = await createVendorData(vendorData);

    await updateProfileById(newUser._id, {
      vendorProfileId: newVendor._id,
    });

    const emailContent = vendorRegistrationRequestTemplate({
      userName,
      email,
      companyName: company_name,
      companyEmail: company_email,
      whatsappNumber: whatsapp_number,
      companyLocation: company_location,
      companyType: company_type,
      hireResources: hire_resources,
      qrCodeHtml: '', // No QR code for HR
      role: Enum.VENDOR, // Explicitly set role as Vendor
    });

    const hrEmail = process.env.SMTP_USER || process.env.USER;
    if (!hrEmail || hrEmail.trim() === '') {
      logger.warn(
        'HR_EMAIL environment variable is not set. Skipping email notification.'
      );
    } else {
      try {
        const emailResult = await sendingEmailHelper({
          email_to: [hrEmail],
          subject: 'New Vendor Registration - Approval Required',
          description: emailContent,
        });

        if (!emailResult || !emailResult.success) {
          logger.warn('Failed to send email to HR, but vendor was created');
        }
      } catch (emailError) {
        logger.error(`Failed to send email to HR: ${emailError.message}`);
      }
    }

    let userRole = '';
    let isAdmin = false;
    let isGuest = false;

    if (req.user && req.user.role) {
      userRole = req.user.role;
      const normalizedRole = userRole.toLowerCase();
      isAdmin = normalizedRole === Enum.ADMIN.toLowerCase();
      isGuest = !isAdmin;
    } else {
      const userWithRole = await User.findById(newUser._id).populate('roleId');
      userRole =
        userWithRole?.roleId?.name || userWithRole?.role || Enum.VENDOR;
      const normalizedRole = userRole.toLowerCase();
      isAdmin = normalizedRole === Enum.ADMIN.toLowerCase();
      isGuest = !isAdmin;
    }

    logger.info(
      `Vendor registration request created for ${email}. HR notification sent.`
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      'Vendor registration submitted successfully. HR has been notified for approval.',
      {
        userId: newUser._id,
        vendorId: newVendor._id,
        email: email,
        status: 'pending_approval',
        isAdmin: isAdmin,
        isGuest: isGuest,
        userRole: userRole,
        addedBy: addedByUserId,
        addedByRole: addedByRole || 'admin',
      }
    );
  } catch (error) {
    logger.error(`Failed to add vendor: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to add vendor: ${error.message}`
    );
  }
};

export const addVendorByQrCode = async (req, res) => {
  try {
    const {
      userName,
      email,
      firstName,
      lastName,
      whatsapp_number,
      phone,
      vendor_linkedin_profile,
      company_name,
      company_email,
      company_phone_number,
      company_location,
      company_type,
      hire_resources,
      company_strength,
      company_linkedin_profile,
      company_website,
      company_state,
      company_city,
      state,
      city,
      role,
    } = req.body;

    let emailValue = null;

    if (
      email &&
      email.trim() &&
      email.trim() !== 'null' &&
      email.trim() !== 'undefined'
    ) {
      emailValue = email.trim();
    } else if (req.body?.Email && req.body.Email.trim()) {
      emailValue = req.body.Email.trim();
    } else if (req.body?.EMAIL && req.body.EMAIL.trim()) {
      emailValue = req.body.EMAIL.trim();
    } else if (req.body?.userEmail && req.body.userEmail.trim()) {
      emailValue = req.body.userEmail.trim();
    } else if (
      company_email &&
      company_email.trim() &&
      company_email.trim() !== 'null'
    ) {
      emailValue = company_email.trim();
    }

    if (
      !emailValue ||
      emailValue === '' ||
      emailValue === 'null' ||
      emailValue === 'undefined'
    ) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Email is required and must be a valid email address. Please ensure the email field is included in your form submission.'
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Please provide a valid email address. Received: ${emailValue}`
      );
    }

    const finalWhatsappNumber =
      whatsapp_number ||
      phone?.whatsappNumber ||
      phone?.['whatsappNumber'] ||
      '';

    let finalUserName = userName?.trim();
    if (!finalUserName || finalUserName === '') {
      const emailParts = emailValue.split('@');
      finalUserName = emailParts[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      const randomSuffix = Math.floor(Math.random() * 10000);
      finalUserName = `${finalUserName}${randomSuffix}`;
    }

    const existingUser = await getUser({ email: emailValue });
    if (existingUser) {
      logger.warn(`User with email ${email} already exists`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `User with email ${email} already exists`
      );
    }

    let checkUserName = finalUserName;
    let attempts = 0;
    while ((await getUserByUserName(checkUserName)) && attempts < 10) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      checkUserName = `${finalUserName}${randomSuffix}`;
      attempts++;
    }
    finalUserName = checkUserName;

    if (await getUserByUserName(finalUserName)) {
      logger.warn(`Unable to generate unique username`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Unable to create unique username. Please try again.`
      );
    }

    const requestedRole = role?.toLowerCase() || Enum.VENDOR.toLowerCase();
    if (
      ![Enum.VENDOR.toLowerCase(), Enum.CLIENT.toLowerCase()].includes(
        requestedRole
      )
    ) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Invalid role. Role must be either '${Enum.VENDOR}' or '${Enum.CLIENT}'.`
      );
    }

    const roleName =
      requestedRole === Enum.CLIENT.toLowerCase() ? Enum.CLIENT : Enum.VENDOR;
    const roleDocument = await Role.findOne({ name: roleName });
    if (!roleDocument) {
      logger.error(`${roleName} role not found`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `${roleName} role not found`
      );
    }

    let isAdminFlag = false;
    let addedByUserId = null;
    let addedByRole = null;

    if (req.user && req.user._id) {
      addedByUserId = req.user._id;
      if (req.user.role) {
        const normalizedRole = req.user.role.toLowerCase();
        isAdminFlag = normalizedRole === Enum.ADMIN.toLowerCase();
        addedByRole = req.user.role;
      } else {
        const requesterUser = await User.findById(req.user._id).populate(
          'roleId'
        );
        if (requesterUser?.roleId?.name) {
          addedByRole = requesterUser.roleId.name;
          const normalizedRole = addedByRole.toLowerCase();
          isAdminFlag = normalizedRole === Enum.ADMIN.toLowerCase();
        }
      }
    } else {
      addedByRole = Enum.GUEST;
    }

    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const roleDisplayName =
      roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
    const defaultFirstName = firstName || company_name || roleDisplayName;

    const newUser = await createUser({
      userName: finalUserName,
      email: emailValue.toLowerCase(),
      password: hashedPassword,
      roleId: roleDocument._id,
      firstName: defaultFirstName,
      lastName: lastName || '',
      isActive: false,
      isAdmin: isAdminFlag,
      addedBy: addedByUserId,
      addedByRole: addedByRole,
      passwordChanged: false,
      state: state || '',
      city: city || '',
    });

    const vendorData = {
      userId: newUser._id,
      whatsapp_number: finalWhatsappNumber,
      vendor_linkedin_profile: vendor_linkedin_profile || '',
      company_name: company_name || '',
      company_email: company_email ? company_email.toLowerCase() : '',
      company_phone_number: company_phone_number || '',
      company_location: company_location || '',
      company_type: company_type || 'both',
      hire_resources: hire_resources || 'all',
      company_strength: company_strength || '',
      company_linkedin_profile: company_linkedin_profile || '',
      company_website: company_website || '',
      company_state: company_state || '',
      company_city: company_city || '',
      type: roleName,
      addedBy: addedByUserId || null,
      addedByRole: addedByRole || null,
    };

    const newVendor = await createVendorData(vendorData);

    await updateProfileById(newUser._id, {
      vendorProfileId: newVendor._id,
    });

    const emailContent = vendorRegistrationRequestTemplate({
      userName: finalUserName,
      email: emailValue,
      companyName: company_name,
      companyEmail: company_email,
      whatsappNumber: finalWhatsappNumber,
      companyLocation: company_location,
      companyType: company_type,
      hireResources: hire_resources,
      qrCodeHtml: '', // No QR code for HR
      role: roleName, // Pass the role (Vendor or Client)
    });

    const hrEmail = process.env.SMTP_USER || process.env.USER;
    console.log(hrEmail);
    if (!hrEmail || hrEmail.trim() === '') {
      logger.warn(
        'HR_EMAIL environment variable is not set. Skipping email notification.'
      );
    } else {
      try {
        const emailSubject = `New ${roleDisplayName} Registration via QR Code - Approval Required`;
        const emailResult = await sendingEmailHelper({
          email: hrEmail,
          subject: emailSubject,
          description: emailContent,
        });

        if (!emailResult || !emailResult.success) {
          logger.warn(
            `Failed to send email to HR, but ${roleDisplayName.toLowerCase()} was created`
          );
        }
      } catch (emailError) {
        logger.error(`Failed to send email to HR: ${emailError.message}`);
      }
    }

    const userWithRole = await User.findById(newUser._id).populate('roleId');
    const userRole =
      userWithRole?.roleId?.name || userWithRole?.role || roleName;
    const normalizedRole = userRole.toLowerCase();
    const isAdmin = normalizedRole === Enum.ADMIN.toLowerCase();
    const isGuest = !isAdmin;

    logger.info(
      `${roleDisplayName} registration via QR code created for ${emailValue}. HR notification sent.`
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `${roleDisplayName} registration submitted successfully via QR code. HR has been notified for approval.`,
      {
        userId: newUser._id,
        vendorId: newVendor._id,
        email: emailValue,
        status: 'pending_approval',
        isAdmin: isAdmin,
        isGuest: isGuest,
        userRole: userRole,
        addedBy: addedByUserId,
        addedByRole: addedByRole || Enum.GUEST,
      }
    );
  } catch (error) {
    const roleType = req.body?.role?.toLowerCase() || 'vendor/client';
    logger.error(`Failed to add ${roleType} via QR code: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to add ${roleType} via QR code: ${error.message}`
    );
  }
};

export const updateVendorByQrCode = async (req, res) => {
  try {
    // Support both vendorId and clientId params (for vendor and client routes)
    const { vendorId, clientId } = req.params;
    const profileId = vendorId || clientId;

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
      company_linkedin_profile,
      company_website,
      company_state,
      company_city,
      state,
      city,
    } = req.body;

    const vendor = await Vendor.findById(profileId);
    if (!vendor) {
      const entityType = clientId ? 'Client' : 'Vendor';
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `${entityType} not found`
      );
    }

    const vendorUpdateData = {
      whatsapp_number: whatsapp_number || vendor.whatsapp_number,
      vendor_linkedin_profile:
        vendor_linkedin_profile || vendor.vendor_linkedin_profile,
      company_name: company_name || vendor.company_name,
      company_email: company_email
        ? company_email.toLowerCase()
        : vendor.company_email,
      company_phone_number: company_phone_number || vendor.company_phone_number,
      company_location: company_location || vendor.company_location,
      company_type: company_type || vendor.company_type,
      hire_resources: hire_resources || vendor.hire_resources,
      company_strength: company_strength || vendor.company_strength,
      company_linkedin_profile:
        company_linkedin_profile || vendor.company_linkedin_profile,
      company_website: company_website || vendor.company_website,
      company_state: company_state || vendor.company_state,
      company_city: company_city || vendor.company_city,
    };

    Object.keys(vendorUpdateData).forEach(
      (key) =>
        (vendorUpdateData[key] === undefined ||
          vendorUpdateData[key] === null) &&
        delete vendorUpdateData[key]
    );

    const updatedVendor = await Vendor.findByIdAndUpdate(
      profileId,
      { $set: vendorUpdateData },
      { new: true }
    );

    // Update user's state and city if provided
    const userUpdateData = {};
    if (state) userUpdateData.state = state;
    if (city) userUpdateData.city = city;

    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(vendor.userId, { $set: userUpdateData });
    }

    const user = await User.findById(vendor.userId).populate('roleId');

    const userRole = user?.roleId?.name || user?.role || '';
    const normalizedRole = userRole.toLowerCase();
    const isAdmin = normalizedRole === Enum.ADMIN.toLowerCase();
    const isGuest = !isAdmin;

    // Determine role display name based on user's actual role
    const roleDisplayName =
      userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

    const emailContent = vendorRegistrationRequestTemplate({
      userName: user?.userName || 'N/A',
      email: user?.email || 'N/A',
      companyName: updatedVendor.company_name,
      companyEmail: updatedVendor.company_email,
      whatsappNumber: updatedVendor.whatsapp_number,
      companyLocation: updatedVendor.company_location,
      companyType: updatedVendor.company_type,
      hireResources: updatedVendor.hire_resources,
      role: userRole, // Pass the actual role (Vendor or Client)
    });

    const hrEmail = process.env.SMTP_USER || process.env.USER;
    if (!hrEmail || hrEmail.trim() === '') {
      logger.warn(
        'HR_EMAIL environment variable is not set. Skipping email notification.'
      );
    } else {
      try {
        const emailResult = await sendingEmailHelper({
          email_to: [hrEmail],
          subject: `${roleDisplayName} Details Updated via QR Code`,
          description: emailContent,
        });

        if (!emailResult || !emailResult.success) {
          logger.warn(
            `Failed to send email to HR, but ${roleDisplayName.toLowerCase()} was updated`
          );
        }
      } catch (emailError) {
        logger.error(`Failed to send email to HR: ${emailError.message}`);
      }
    }

    logger.info(
      `${roleDisplayName} ${profileId} updated via QR code. HR notified.`
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `${roleDisplayName} details updated successfully via QR code. HR has been notified.`,
      {
        vendorId: updatedVendor._id,
        status: 'updated',
        isAdmin: isAdmin,
        isGuest: isGuest,
        userRole: userRole,
      }
    );
  } catch (error) {
    const entityType = req.params.clientId ? 'client' : 'vendor';
    logger.error(
      `Failed to update ${entityType} via QR code: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to update ${entityType} via QR code: ${error.message}`
    );
  }
};

// Get matching applicants for a job based on required skills
export const getMatchingApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Valid Job ID is required'
      );
    }

    // Get job details with required skills and job creator info
    const job = await jobs
      .findById(jobId)
      .select('required_skills job_subject addedBy')
      .populate({
        path: 'addedBy',
        model: 'user',
        select: 'firstName lastName email roleId',
        populate: {
          path: 'roleId',
          model: 'Role',
          select: 'name',
        },
      })
      .lean();
    if (!job) {
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, 'Job not found');
    }

    // Get job creator role
    const jobAddedByRole = job.addedBy?.roleId?.name || null;

    const requiredSkills = job.required_skills || [];
    if (requiredSkills.length === 0) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Job has no required skills defined'
      );
    }

    // Normalize job skills for matching
    const normalizedJobSkills = requiredSkills.map((skill) =>
      skill.trim().toLowerCase()
    );

    // Build applicant query
    let applicantQuery = {
      isDeleted: false,
      isActive: true,
      email: { $exists: true, $ne: '' },
    };

    // Match applicants whose appliedSkills contain any of the required skills
    applicantQuery.appliedSkills = {
      $in: normalizedJobSkills.map(
        (skill) =>
          new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      ),
    };

    // Add search filter if provided
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      applicantQuery.$and = [
        {
          $or: [
            { 'name.firstName': searchRegex },
            { 'name.lastName': searchRegex },
            { email: searchRegex },
            { 'phone.phoneNumber': searchRegex },
            { appliedSkills: searchRegex },
          ],
        },
      ];
    }

    // Get total count
    const totalCount = await Applicant.countDocuments(applicantQuery);

    // Fetch matching applicants
    const applicants = await Applicant.find(applicantQuery)
      .select(
        'name email phone appliedSkills otherSkills currentCompanyName currentCompanyDesignation totalExperience currentCity state workPreference noticePeriod preferredLocations resumeUrl'
      )
      .skip(skip)
      .limit(limit)
      .sort({ totalExperience: -1, createdAt: -1 })
      .lean();

    // Get applicant emails to check existing job applications
    const applicantEmails = applicants.map((a) => a.email);

    // Check which applicants have already applied to this job
    const existingApplications = await jobApplication
      .find({
        job_id: jobId,
        email: { $in: applicantEmails },
        isDeleted: false,
      })
      .select('email status interviewStage')
      .lean();

    // Create a map for quick lookup of existing applications
    const applicationMap = new Map(
      existingApplications.map((app) => [
        app.email,
        { status: app.status, interviewStage: app.interviewStage },
      ])
    );

    // Calculate skill match for each applicant
    const enrichedApplicants = applicants.map((applicant) => {
      const applicantSkills = (applicant.appliedSkills || []).map((s) =>
        s.toLowerCase().trim()
      );
      const matchingSkills = applicantSkills.filter((skill) =>
        normalizedJobSkills.some(
          (reqSkill) =>
            reqSkill === skill ||
            reqSkill.includes(skill) ||
            skill.includes(reqSkill)
        )
      );
      const matchingCount = matchingSkills.length;
      const matchPercentage =
        normalizedJobSkills.length > 0
          ? Math.round((matchingCount / normalizedJobSkills.length) * 100)
          : 0;

      // Check if applicant has already applied to this job
      const existingApplication = applicationMap.get(applicant.email);
      const hasAppliedToJob = !!existingApplication;

      return {
        ...applicant,
        skillsMatch: {
          matchingSkills: matchingSkills,
          matchingCount: matchingCount,
          totalRequired: normalizedJobSkills.length,
          matchPercentage: matchPercentage,
        },
        jobApplicationStatus: {
          hasApplied: hasAppliedToJob,
          status: existingApplication?.status || null,
          interviewStage: existingApplication?.interviewStage || null,
        },
      };
    });

    // Sort by match percentage (highest first)
    enrichedApplicants.sort(
      (a, b) => b.skillsMatch.matchPercentage - a.skillsMatch.matchPercentage
    );

    logger.info(`Matching applicants for job ${jobId} fetched successfully`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Matching applicants ${Message.FETCH_SUCCESSFULLY}`,
      {
        job: {
          _id: job._id,
          job_subject: job.job_subject,
          required_skills: requiredSkills,
          addedBy: {
            _id: job.addedBy?._id,
            firstName: job.addedBy?.firstName,
            lastName: job.addedBy?.lastName,
            email: job.addedBy?.email,
            role: jobAddedByRole,
          },
        },
        applicants: enrichedApplicants,
        pagination: {
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          limit,
        },
      }
    );
  } catch (error) {
    logger.error(`Failed to fetch matching applicants: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to fetch matching applicants: ${error.message}`
    );
  }
};
