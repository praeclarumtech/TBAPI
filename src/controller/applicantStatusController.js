import applicantStatus from '../models/applicantStatusModel.js';
import {
  create,
  getAllApplicantStatus,
  getApplicantStatusById,
  updateApplicantStatus,
  deleteApplicantStatusById,
  removeManyApplicantStatus,
} from '../services/applicantStatusService.js';

import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';

export const addApplicantStatus = async (req, res) => {
  const { status } = req.body;
  if (!status || typeof status !== 'string') {
    logger.warn(`Applicant Status is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Applicant Status ${Message.FIELD_REQUIRED}`
    );
  }

  try {
    const existing = await applicantStatus.findOne({
      status: { $regex: new RegExp(`^${status}$`, 'i') },
    });

    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Applicant Status ${Message.ALREADY_EXIST}!`
      );
    }

    const result = await create({ status });
    logger.info(`Applicant Status is ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Applicant Status is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add Applicant Status.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add Applicant Status.`
    );
  }
};

export const getApplicantStatuse = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(500, Math.max(1, parseInt(req.query.limit))) || 500;
    let search = req.query.search || '';

    let data;
    let totalRecords;

    if (search) {
      const searchFields = ['status'];
      const searchResult = await commonSearch(
        applicantStatus,
        searchFields,
        search
      );
      data = searchResult.results;
      totalRecords = searchResult.totalRecords;
    } else {
      totalRecords = await applicantStatus.countDocuments({ isDeleted: false });
      data = await getAllApplicantStatus(page, limit);
    }

    logger.info(`All Applicant Statuses are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All Applicant Statuses are ${Message.FETCH_SUCCESSFULLY}`,
      {
        data,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch Applicant Statuses.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch Applicant Statuses.`
    );
  }
};

export const viewApplicantStatusById = async (req, res) => {
  const { ApplicantStatusId } = req.params;
  try {
    const result = await getApplicantStatusById(ApplicantStatusId);
    if (!result) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(`Applicant Status is ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant Status is ${Message.FETCH_BY_ID}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch Applicant Status by ID.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch Applicant Status by ID.`
    );
  }
};

export const updateApplicantStatuses = async (req, res) => {
  try {
    const { ApplicantStatusId } = req.params;
    const updateData = req.body;

    const existing = await applicantStatus.findOne({
      _id: { $ne: ApplicantStatusId },
      status: { $regex: new RegExp(`^${updateData.status}$`, 'i') },
    });

    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Applicant Status ${Message.ALREADY_EXIST}!`
      );
    }

    const updated = await updateApplicantStatus(ApplicantStatusId, updateData);

    if (!updated) {
      logger.warn(`Applicant Status is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant Status is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant Status is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant Status is ${Message.UPDATED_SUCCESSFULLY}`,
      updated
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Applicant Status.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update Applicant Status.`
    );
  }
};

export const deleteApplicantStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteApplicantStatusById(id);

    if (result.deletedCount === 0) {
      logger.warn(`Applicant Status is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant Status is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant Status is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant Status is ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete Applicant Status.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete Applicant Status.`
    );
  }
};

export const deleteManyApplicantStatus = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(`ObjectId is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OBJ_ID_NOT_FOUND
      );
    }

    const result = await removeManyApplicantStatus(ids);

    if (result.deletedCount === 0) {
      logger.warn(`Applicant Status is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Applicant Status is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant Status is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant Status is ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleteMany Applicant Status.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany Applicant Status.`
    );
  }
};
