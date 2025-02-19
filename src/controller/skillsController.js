import Skills from '../models/skillsModel.js';
import {
  create,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkillById,
} from '../services/skillsService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';

export const addSkills = async (req, res) => {
  const { skills } = req.body;
  if (!skills) {
    logger.warn(Message.NOT_FOUND);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      Message.SKILL_FIELD_IS_REQUIRED
    );
  }
  try {
    const result = await create({ skills });
    logger.info(Message.SKILL_ADDED);
    HandleResponse(res, true, StatusCodes.OK, Message.SKILL_ADDED, result);
  } catch (error) {
    logger.error(`${Message.INTERNAL_SERVER_ERROR}: ${error.message}`)
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INTERNAL_SERVER_ERROR,
      error
    );
  }
};

export const getSkills = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 10;
    const totalRecords = await Skills.countDocuments();
    const getskills = await getAllSkills(page, limit);

    logger.info(Message.FETCHED_SKILLS_SUCCESSFULLY);
    HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHED_SKILLS_SUCCESSFULLY,
      {
        getskills,
        pagination: {
          totalRecords: totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          limit: limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.INTERNAL_SERVER_ERROR}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INTERNAL_SERVER_ERROR,
      error
    );
  }
};

export const getSkillsById = async (req, res) => {
  const { skillId } = req.params;
  try {
    const result = await getSkillById(skillId);
    if (!result) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(Message.FETCHED_SKILLS_SUCCESSFULLY);
     return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHED_SKILLS_SUCCESSFULLY,
      result
    );
  } catch (error) {
    logger.error(`${Message.INTERNAL_SERVER_ERROR}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateSkills = async (req, res) => {
  try {
    const { skillId } = req.params;
    const updateData = req.body;

    const updatedSkill = await updateSkill(skillId, updateData);

    if (!updatedSkill) {
      logger.warn(Message.NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(`${Message.SUCCESSFULLY_UPDATED}: ${skillId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      Message.UPDATED_SUCCESSFULLY,
      updatedSkill
    );
  } catch (error) {
    logger.error(Message.INTERNAL_SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteSkills = async (req, res) => {
  try {
    const { skillId } = req.params;
    const deletedSkill = await deleteSkillById(skillId, {
      isDeleted: true,
    });

    if (!deletedSkill) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }
    logger.info(`${Message.DELETED_SUCCESSFULLY}: ${skillId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.DELETED_SUCCESSFULLY,
      deletedSkill
    );
  } catch (error) {
    logger.error(`${Message.INTERNAL_SERVER_ERROR}: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INTERNAL_SERVER_ERROR
    );
  }
};
