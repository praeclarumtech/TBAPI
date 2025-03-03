import Skills from '../models/skillsModel.js';
import {
  create,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkillById,
  searchSkillsService
} from '../services/skillsService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';

export const addSkills = async (req, res) => {
  const { skills } = req.body;
  if (!skills || typeof skills !== "string") {
    logger.warn(`skills is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Skills ${Message.FIELD_REQUIRED}`
    );
  }
  try {
    const existingSkill = await Skills.findOne({ skills });
    if (existingSkill) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Skill ${Message.ALREADY_EXIST}: ${skills}`
      );
    }

    const result = await create({ skills });
    logger.info(`Skills is ${Message.ADDED_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Skills is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add skills.`
    );
  }
};

export const getSkills = async (req, res) => {
  try {
    let page = Math.max(1, parseInt(req.query.page)) || 1;
    let limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 10;
    const totalRecords = await Skills.countDocuments({ isDeleted: false });
    const getskills = await getAllSkills(page, limit);

    logger.info(`All skills are ${Message.FETCH_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All skills are ${Message.FETCH_SUCCESSFULLY}`,
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
    logger.error(`${Message.FAILED_TO} fetch skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch skills.`
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
    logger.info(`Skill is ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Skill is ${Message.FETCH_BY_ID}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch skills by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch skills by id.`
    );
  }
};

export const updateSkills = async (req, res) => {
  try {
    const { skillId } = req.params;
    const updateData = req.body;

    const updatedSkill = await updateSkill(skillId, updateData);

    if (!updatedSkill) {
      logger.warn(`Skill is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Skill is ${Message.NOT_FOUND}`
      );
    }
    logger.info(`Skills is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Skills is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedSkill
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update skills.`
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
      logger.warn(`Skill is ${Message.NOT_FOUND}`)
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Skill is ${Message.NOT_FOUND}`
      );
    }
    logger.info(`year ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `year is ${Message.DELETED_SUCCESSFULLY}`,
      deletedSkill
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete skills.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete skills.`
    );
  }
};

export const searchSkills = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, "Search query is required.");
    }

    const { results, totalRecords } = await searchSkillsService(query, parseInt(page), parseInt(limit));

    const totalPages = Math.ceil(totalRecords / limit);

    logger.info(`Skills Search ${Message.FETCH_SUCCESSFULLY}`);
    HandleResponse(res, true, StatusCodes.OK, `Skills Search ${Message.FETCH_SUCCESSFULLY}`, {
      skills: results,
      pagination: {
        totalRecords,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error(`${Message.FAILED_TO} search skills.`);
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} search skills.`);
  }
};




