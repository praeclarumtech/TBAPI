import { Message } from '../utils/constant/passingYearMessage.js';
import {
  createYear,
  getOneYear,
  updateYearById,
  deleteYearById,
} from '../services/passingYear.js';
import { pagination } from '../helpers/commonFunction/passingYearPagination.js';
import PassingYear from '../models/passingYear.js';
import logger from '../loggers/logger.js';
import {HandleResponse} from '../helpers/handleResponse.js'
import { StatusCodes } from 'http-status-codes';

export const addYear = async (req, res) => {
  try {
    await createYear(req.body.year);
    logger.info(Message.NEW_YEAR);
    HandleResponse(
          res,
          true,
          StatusCodes.CREATED,
          Message.NEW_YEAR,
        );
  } catch (error) {
    logger.error(Message.INT_SE_ERR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INT_SE_ERR
    )
  }
};

export const getYears = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const findYears = await pagination({ Schema: PassingYear, page, limit });  

    logger.info(Message.SHOW_YEARS);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.SHOW_YEARS,
      findYears
    )
      } catch (error) {
    logger.error(Message.INT_SE_ERR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INT_SE_ERR
    )
  }
};

export const getYearById = async (req, res) => {
  try {
    const yearId = req.params.id;
    const yearDetail = await getOneYear(yearId);
    logger.info(Message.YEAR_BY_ID);
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.YEAR_BY_ID,
      yearDetail
    )
  } catch (error) {
    logger.warn(Message.YEAR_NF);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.YEAR_NF
    )
  }
};

export const updateYear = async (req, res) => {
  try {
    const updateYear = await updateYearById(req.params.id, req.body);
    logger.info(Message.YEAR_UP);
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.YEAR_UP,
      updateYear
    );
  } catch (error) {
    logger.error(Message.INV_CR);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      Message.INV_CR
    )
  }
};

export const deleteYear = async (req, res) => {
  try {
    const deleteYear = await deleteYearById(req.params.id, {
      is_deleted: true,
    });
    if (!deleteYear) {
      logger.warn(Message.DATA_NF);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.DATA_NF
      )
    }
    logger.info(Message.YEAR_DEL);
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.YEAR_DEL,
      deleteYear
    )
  } catch (error) {
    logger.error(Message.INT_SE_ERR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INT_SE_ERR
    )
  }
};
