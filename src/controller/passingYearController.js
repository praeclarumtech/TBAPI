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

export const addYear = async (req, res) => {
  try {
    await createYear(req.body.year);
    logger.info(Message.NEW_YEAR);
    res.status(201).json({
      success: true,
      message: Message.NEW_YEAR,
    });
  } catch (error) {
    logger.error(Message.INT_SE_ERR);
    res.status(500).json({
      success: false,
      message: Message.INT_SE_ERR,
      error: error.message,
    });
  }
};

export const getYears = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const findYears = await pagination({ Schema: PassingYear, page, limit });

    logger.info(Message.SHOW_YEARS);
    res.status(200).json({
      success: true,
      message: Message.SHOW_YEARS,
      data: {
        item: findYears.getYears,
        totalRecords: findYears.totalRecords,
        currentPage: page,
        totalPages:
          findYears.totalRecords && limit > 0
            ? Math.ceil(findYears.totalRecords / limit)
            : 0,
        limit,
      },
    });
  } catch (error) {
    logger.error(Message.YEAR_NF);
    res.status(404).json({
      success: false,
      message: Message.YEAR_NF,
      error: error.message,
    });
  }
};

export const getYearById = async (req, res) => {
  try {
    const yearId = req.params.id;
    const yearDetail = await getOneYear(yearId);
    logger.info(Message.YEAR_BY_ID);
    return res.status(200).json({
      success: true,
      message: Message.YEAR_BY_ID,
      data: yearDetail,
    });
  } catch (error) {
    logger.warn(Message.YEAR_NF);
    res.status(404).json({
      success: false,
      message: Message.YEAR_NF,
      error: error.message,
    });
  }
};

export const updateYear = async (req, res) => {
  try {
    const updateYear = await updateYearById(req.params.id, req.body);
    logger.info(Message.YEAR_UP);
    res.status(202).json({
      success: true,
      message: Message.YEAR_UP,
      data: updateYear,
    });
  } catch (error) {
    logger.error(Message.INV_CR);
    res.status(500).json({
      success: false,
      message: Message.INV_CR,
      error: error.message,
    });
  }
};

export const deleteYear = async (req, res) => {
  try {
    const deleteYear = await deleteYearById(req.params.id, {
      is_deleted: true,
    });
    if (!deleteYear) {
      logger.warn(Message.DATA_NF);
      return res.status(404).json({
        success: false,
        message: Message.DATA_NF,
      });
    }
    logger.info(Message.YEAR_DEL);
    res.status(200).json({
      success: true,
      message: Message.YEAR_DEL,
      data: deleteYear,
    });
  } catch (error) {
    logger.error(Message.INT_SE_ERR);
    res.status(500).json({
      success: false,
      message: Message.INT_SE_ERR,
      error: error.message,
    });
  }
};
