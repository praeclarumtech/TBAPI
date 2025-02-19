import {
  createApplicant,
  getApplicantById,
  updateApplicantById
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
    const applicationNo = await generateApplicantNo();
    const applicantData = {
      applicationNo,
      name: { firstName, middleName, lastName },
      ...body,
    };
    const applicant = await createApplicant(applicantData);
    logger.info(`${Message.APPLICANT_SUBMIT_SUCCESSFULLY}: ${applicant._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      Message.APPLICANT_SUBMIT_SUCCESSFULLY,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.ERROR_ADDING_AAPLICANT}: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `${Message.FAILED_TO} add aplicant.`
    );
  }
};
 
export const viewAllApplicant = async (req, res) => {
  try {
    const{
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
 
    logger.info(Message.FETCHED_APPLICANT_SUCCESSFULLY);
    return HandleResponse(res, true, StatusCodes.OK, Message.FETCHED_APPLICANT_SUCCESSFULLY, findYears);
  } catch (error) {
    logger.error(`${Message.ERROR_RETRIEVING_APPLICANTS}: ${error.message}`, {
      stack: error.stack,
    });
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
    logger.info(`${Message.FETCHED_APPLICANT_SUCCESSFULLY}: ${applicantId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHED_APPLICANT_SUCCESSFULLY,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.ERROR_RETRIEVING_APPLICANTS}: ${error.message}`, {
      stack: error.stack,
    });
  }
  return HandleResponse(
    res,
    false,
    StatusCodes.INTERNAL_SERVER_ERROR,
    `${Message.FAILED_TO} view applicant by id.`
  );
};
 
export const updateApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const {
      name: { first, middle, last },
      ...body
    } = req.body;
 
    let updateData = { name: { first, middle, last }, ...body };
    const updatedApplicant = await updateApplicantById(applicantId, updateData);
 
    if (!updatedApplicant) {
      logger.warn(`${Message.USER_NOT_FOUND}: ${applicantId}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }
 
    logger.info(`${Message.UPDATED_SUCCESSFULLY}: ${applicantId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.UPDATED_SUCCESSFULLY,
      updatedApplicant
    );
  } catch (error) {
    logger.error(`${Message.ERROR_UPDATING_APPLICANT}: ${error.message}`);
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
   
    const applicant = await updateApplicantById(applicantId, {isDeleted: true});
 
    if (!applicant) {
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.APPLICANT_NOT_FOUND
      );
    }
 
    logger.info(`${Message.APPLICANT_DELETED_SUCCESSFULLY}: ${applicantId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.APPLICANT_DELETED_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(`${Message.ERROR_DELETING_APPLICANT}: ${error.message}`, {
      stack: error.stack,
    });
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
 
    logger.info(`Applicant status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status ${Message.UPDATED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.ERROR_UPDATING_APPLICANT}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant.`
    );
  }
};
 
 
