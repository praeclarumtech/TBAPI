import designations from '../models/designationModel.js';
import {
  create,
  getAllDesignation,
  getDesignationById,
  updateDesignation,
  deleteDesignationById,
} from '../services/designationsService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';

export const adddesignations = async (req, res) => {
  const { designation } = req.body;
  if (!designation || typeof designation !== 'string') {
    logger.warn(`designation is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `designation ${Message.FIELD_REQUIRED}`
    );
  }
  try {
    const existingDesignation = await designations.findOne({
      designation: { $regex: new RegExp(`^${designation}$`, 'i') },
    });
    if (existingDesignation) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `designation ${Message.ALREADY_EXIST}!`
      );
    }

    const result = await create({ designation });
    logger.info(`designation is ${Message.ADDED_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `designation is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add designation.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add designation.`
    );
  }
};

export const getDesignation = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(500, Math.max(1, parseInt(req.query.limit))) || 500;
    let search = req.query.search || '';

    let data;
    let totalRecords;

    if (search) {
      const searchFields = ['designation'];
      const searchResult = await commonSearch(
        designations,
        searchFields,
        search
      );
      data = searchResult.results;
      totalRecords = searchResult.totalRecords;
    } else {
      totalRecords = await designations.countDocuments({ isDeleted: false });
      data = await getAllDesignation(page, limit);
    }

    logger.info(`All designation are ${Message.FETCH_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All designation are ${Message.FETCH_SUCCESSFULLY}`,
      {
        data,
        pagination: {
          totalRecords: totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          limit: limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch designation.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch designation.`
    );
  }
};

export const getDesignationsById = async (req, res) => {
  const { designationId } = req.params;
  try {
    const result = await getDesignationById(designationId);
    if (!result) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(`Designations is ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Designations is ${Message.FETCH_BY_ID}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch Designations by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch Designations by id.`
    );
  }
};

export const updateDesignations = async (req, res) => {
  try {
    const { designationId } = req.params;
    const updateData = req.body;

    const existing = await designations.findOne({
      _id: { $ne: designationId },
      designation: { $regex: new RegExp(`^${updateData.designation}$`, 'i') },
    });

    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `designation ${Message.ALREADY_EXIST}!`
      );
    }

    const updatedDesignations = await updateDesignation(
      designationId,
      updateData
    );

    if (!updatedDesignations) {
      logger.warn(`Designation is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Designation is ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Designation is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Designation is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedDesignations
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Designation.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update Designation.`
    );
  }
};

export const deleteDesignation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteDesignationById(id);

    if (result.deletedCount === 0) {
      logger.warn(`Designation is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Designation is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Designation is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Designation is ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`Failed to delete record. ${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete Designation.`
    );
  }
};
