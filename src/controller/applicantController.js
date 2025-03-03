import {
  createApplicant,
  getApplicantById,
  updateApplicantById,
  searchApplicantsService
} from '../services/applicantService.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { generateApplicantNo } from '../helpers/generateApplicationNo.js';
import Applicant from '../models/applicantModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';

export const addApplicant = async (req, res) => {
  try {
    const {
      name: { firstName, middleName, lastName },
      ...body
    } = req.body;

    let id = null
    if (req?.user) {
     const request = req?.user;
     id = request.id
    }
    const applicationNo = await generateApplicantNo();
    const applicantData = {
      applicationNo,
      name: { firstName, middleName, lastName },
      user_id: id,
      ...body,
    };
    const applicant = await createApplicant(applicantData);
    logger.info(`Applicant is ${Message.ADDED_SUCCESSFULLY}: ${applicant._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Applicant is ${Message.ADDED_SUCCESSFULLY}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add aplicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add aplicant.`
    );
  }
};

export const viewAllApplicant = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      applicationNo,
      appliedSkills,
      totalExperience,
      startDate,
      endDate,
    } = req.body;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    let query = { isDeleted: false };

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (
      appliedSkills &&
      Array.isArray(appliedSkills) &&
      appliedSkills.length > 0
    ) {
      query.appliedSkills = { $in: appliedSkills };
    }

    if (totalExperience && !isNaN(totalExperience)) {
      query.totalExperience = parseInt(totalExperience);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate)
        query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const findYears = await pagination({
      Schema: Applicant,
      page: pageNum,
      limit: limitNum,
      query,
      sort: { createdAt: -1 },
    });

    logger.info(`Applicant are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant are ${Message.FETCH_SUCCESSFULLY}`,
      findYears
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view all applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view all applicant.`
    );
  }
};

export const viewApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await getApplicantById(applicantId);

    if (!applicant) {
      logger.warn(Message.APPLICANT_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.APPLICANT_NOT_FOUND
      );
    }
    logger.info(`Applicant is ${Message.FETCH_BY_ID}: ${applicantId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is  ${Message.FETCH_BY_ID}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view applicant by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view applicant by id.`
    );
  }
};

export const updateApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const {
      name: { firstName, middleName, lastName },
      ...body
    } = req.body;
 
    let updateData = { name: { firstName, middleName, lastName }, ...body }; 
    const updatedApplicant = await updateApplicantById(applicantId, updateData);

    if (!updatedApplicant) {
      logger.warn(`User is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`User is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `User is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedApplicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant.`
    );
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const applicant = await updateApplicantById(applicantId, {
      isDeleted: true,
    });

    if (!applicant) {
      logger.warn(`User is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is ${Message.DELETED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete applicant.`
    );
  }
};

export const updateStatus = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const { interviewStage, status } = req.body;

    const updateStatus = await updateApplicantById(applicantId, {
      interviewStage,
      status,
    });

    if (!updateStatus) {
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant status is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status is ${Message.UPDATED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant.`
    );
  }
};

export const searchApplicants = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, "Search query is required.");
    }

    const { results, totalRecords } = await searchApplicantsService(query, parseInt(page), parseInt(limit));

    const totalPages = Math.ceil(totalRecords / limit);

    logger.info(`Applicant Search ${Message.FETCH_SUCCESSFULLY}`);
    HandleResponse(res, true, StatusCodes.OK, `Applicant Search ${Message.FETCH_SUCCESSFULLY}`, {
      Applicant: results,
      pagination: {
        totalRecords,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error(`${Message.FAILED_TO} search Applicant.`);
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR,`${Message.FAILED_TO} search Applicant.`);
  }
};

