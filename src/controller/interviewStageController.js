import interviewStage from '../models/interviewstageModel.js';
import {
  create,
  getAllInterviewStage,
  getInterviewStageById,
  updateInterviewStage,
  deleteInterviewStageById,
  removeManyInterviewStage,
} from '../services/interviewStageService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';

export const addInterviewStage = async (req, res) => {
  const { stage } = req.body;
  if (!stage || typeof stage !== 'string') {
    logger.warn(`interviewStage is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `interviewStage ${Message.FIELD_REQUIRED}`
    );
  }
  try {
    const existingInterviewStage = await interviewStage.findOne({
      stage: { $regex: new RegExp(`^${stage}$`, 'i') },
    });
    if (existingInterviewStage) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `InterviewStage ${Message.ALREADY_EXIST}!`
      );
    }

    const result = await create({ stage });
    logger.info(`InterviewStage is ${Message.ADDED_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `InterviewStage is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add InterviewStage.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add InterviewStage.`
    );
  }
};

export const getinterviewStage = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(500, Math.max(1, parseInt(req.query.limit))) || 500;
    let search = req.query.search || '';

    let data;
    let totalRecords;

    if (search) {
      const searchFields = ['stage'];
      const searchResult = await commonSearch(
        interviewStage,
        searchFields,
        search
      );
      data = searchResult.results;
      totalRecords = searchResult.totalRecords;
    } else {
      totalRecords = await interviewStage.countDocuments({ isDeleted: false });
      data = await getAllInterviewStage(page, limit);
    }

    logger.info(`All Interview Stage are ${Message.FETCH_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All Interview Stage are ${Message.FETCH_SUCCESSFULLY}`,
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
    logger.error(`${Message.FAILED_TO} fetch Interview Stage.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch Interview Stage.`
    );
  }
};

export const viewInterviewStageById = async (req, res) => {
  const { InterviewStageId } = req.params;
  try {
    const result = await getInterviewStageById(InterviewStageId);
    if (!result) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(`Interview Stage is ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Interview Stage is ${Message.FETCH_BY_ID}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch interview stage by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch interview stage by id.`
    );
  }
};

export const updateInterviewStages = async (req, res) => {
  try {
    const { InterviewStageId } = req.params;
    const updateData = req.body;

    const existing = await interviewStage.findOne({
      _id: { $ne: InterviewStageId },
      stage: { $regex: new RegExp(`^${updateData.stage}$`, 'i') },
    });

    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Interview Stage ${Message.ALREADY_EXIST}!`
      );
    }

    const updatedInterviewStage = await updateInterviewStage(
      InterviewStageId,
      updateData
    );

    if (!updatedInterviewStage) {
      logger.warn(`Interview Stage is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Interview Stage is ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Interview Stage is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Interview Stage is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedInterviewStage
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Interview Stage.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update Interview Stage.`
    );
  }
};

export const deleteInterviewStage = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteInterviewStageById(id);

    if (result.deletedCount === 0) {
      logger.warn(`Interview Stage is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Interview Stage is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Interview Stage is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Interview Stage is ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`Failed to delete record. ${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete Interview Stage.`
    );
  }
};

export const deleteManyInterviewStage = async (req, res) => {
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

    const removeInterviewStage = await removeManyInterviewStage(ids);

    if (removeInterviewStage.deletedCount === 0) {
      logger.warn(`Interview Stage is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Interview Stage is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Interview Stage is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Interview Stage is ${Message.DELETED_SUCCESSFULLY}`,
      removeInterviewStage
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleteMany Interview Stage.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany Interview Stage.`
    );
  }
};
