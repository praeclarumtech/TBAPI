import { Message } from '../utils/constant/message.js';
import {
  createYear,
  getOneYear,
  updateYearById,
  deleteYearById,
} from '../services/passingYearService.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import PassingYear from '../models/passingYear.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';

export const addYear = async (req, res) => {
  try {
    const { year } = req.body;

    const existingYear = await PassingYear.findOne({ year, is_deleted: false });
    if (existingYear) {
      logger.warn(`Year ${year} ${Message.ALREADY_EXIST}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Year ${year} ${Message.ALREADY_EXIST}`
      );
    }

    await createYear(req.body.year);
    logger.info(`year ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `year ${Message.ADDED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add year.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add year.`
    );
  }
};

export const getYears = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const findYears = await pagination({ Schema: PassingYear, page, limit ,query: { is_deleted: false }},);

    logger.info(`All years ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All years ${Message.FETCH_SUCCESSFULLY}`,
      findYears
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch years.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch years.`
    );
  }
};

export const getYearById = async (req, res) => {
  try {
    const yearId = req.params.id;
    const yearDetail = await getOneYear(yearId);
    logger.info(`Year ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Year ${Message.FETCH_BY_ID}`,
      yearDetail
    );
  } catch (error) {
    logger.warn(`${Message.FAILED_TO} fetch Year.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch Year.`
    );
  }
};

export const updateYear = async (req, res) => {
  try {
    const updateYear = await updateYearById(req.params.id, req.body);
    logger.info(`Year ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Year ${Message.UPDATED_SUCCESSFULLY}`,
      updateYear
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update year.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `${Message.FAILED_TO} update year.`
    );
  }
};

export const deleteYear = async (req, res) => {
  try {
    const deleteYear = await deleteYearById(req.params.id, {
      is_deleted: true,
    });
    if (!deleteYear) {
      logger.warn(`Year ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Year ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Year ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Year ${Message.DELETED_SUCCESSFULLY}`,
      deleteYear
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleted year`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleted year`
    );
  }
};
