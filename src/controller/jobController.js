import { StatusCodes } from 'http-status-codes';
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
import { Enum } from '../utils/enum.js';
import User from '../models/userModel.js';
import { sendingEmail } from "../utils/email.js";
import {jobCreatedTemplate} from "../utils/emailTemplates/emailTemplates.js";

export const createJob = async (req, res) => {
  try {
    const user = req.user.id;

    // ✅ Fetch user with role populated
    const userData = await User.findById(user).populate("roleId", "name");

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
        "company_name",
        "company_email",
        "company_phone_number",
        "company_location",
        "company_type",
        "hire_resources",
        "company_strength",
        "company_website",
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
    const finalDate = applicationDeadline.toLocaleDateString("en-CA");

    const jobData = {
      job_id,
      addedBy: user,
      application_deadline: finalDate,
      ...req.body,
    };

    await createJobService(jobData);
    logger.info(`job ${Message.ADDED_SUCCESSFULLY}`);

    // ✅ Send Email after job creation
    let emailStatus = {};
    try {
      const htmlBlock = jobCreatedTemplate({
        jobId: job_id,
        role: userData.roleId?.name || userData.role || "N/A", // ✅ fixed
        jobTitle: req.body.job_subject,
        startDate: req.body.start_time,
        endDate: req.body.end_time,
        createdBy: `${userData.firstName} ${userData.lastName}`,
        createdAt: new Date().toLocaleString(),
      });

      emailStatus = await sendingEmail({
        email_to: [process.env.HR_EMAIL],
        subject: "New Job Created",
        description: htmlBlock,
      });
    } catch (err) {
      logger.error("Email failed:", err);
      emailStatus = { success: false, error: err.message };
    }

    // ✅ Response in Postman will include email status
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `job ${Message.ADDED_SUCCESSFULLY}`,
      { jobData, emailStatus }
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
      filterBy
    } = req.query;
    const query = { isDeleted: false };

    const user = req.user || {};

    if (posted_by_role) {
      const usersWithRole = await User.find({ role: posted_by_role }, '_id').lean();
      const userIds = usersWithRole.map((u) => u._id);
      query.addedBy = { $in: userIds };
    } else if (user?.role === Enum.VENDOR) {
      query.addedBy = user.id;
    } else if (user?.role === Enum.CLIENT) {
      query.addedBy = user.id
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

    if (user.role === Enum.ADMIN && filterBy === Enum.VENDOR) {
      const vendorUsers = await getAllusers({ role: Enum.VENDOR }, { _id: 1 });
      const vendorIds = vendorUsers.map(v => v._id);
      query.addedBy = { $in: vendorIds };
    } else if (user.role === Enum.ADMIN && filterBy === Enum.CLIENT) {
      const clientUsers = await getAllusers({ role: Enum.CLIENT }, { _id: 1 });
      const clientIds = clientUsers.map(v => v._id);
      query.addedBy = { $in: clientIds };
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
    await updateJobService(jobId, req.body);
    logger.info(`Job ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Job ${Message.UPDATED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch job`);
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