import appliedRoleModel from '../models/appliedRoleModel.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import {
  create,
  getSkillsByAppliedRole,
  updateAppliedRole,
  deleteSkill,
  getSkillById,
  getAllSkillAndAppliedRole,
} from '../services/appliedRoleservice.js';
import { commonSearch } from '../helpers/commonFunction/search.js';
import logger from '../loggers/logger.js';

export const addAppliedRoleAndSkills = async (req, res) => {
  const { appliedRole, skill } = req.body;
  if (!skill || typeof skill !== 'string' || !appliedRole) {
    logger.warn(`skill or appliedRole is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Skill or appliedRole ${Message.FIELD_REQUIRED}`
    );
  }
  try {
    const existing = await appliedRoleModel.findOne({
      skill: { $regex: `^${skill.trim()}$`, $options: 'i' },
      appliedRole: { $regex: `^${appliedRole.trim()}$`, $options: 'i' },
      isDeleted: false,
    });

    if (existing) {
      logger.warn('Duplicate skill for the same applied role not allowed.');
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'This skill already exists for the given applied role.'
      );
    }

    const result = await create({ skill, appliedRole });
    logger.info(`Skill is ${Message.ADDED_SUCCESSFULLY}`);
    HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Skill is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add skill.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add skill.`
    );
  }
};

export const viewSkillsByAppliedRole = async (req, res) => {
  const { appliedRole } = req.query;

  if (!appliedRole) {
    logger.warn(`Applied role is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Applied role ${Message.FIELD_REQUIRED}`
    );
  }

  try {
    const skills = await getSkillsByAppliedRole(appliedRole);

    if (!skills.length) {
      logger.info(
        `skills ${Message.NOT_FOUND}  for applied role: ${appliedRole}`
      );
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `skills ${Message.NOT_FOUND}  for applied role: ${appliedRole}`,
        []
      );
    }

    logger.info(
      `Skills ${Message.FETCH_SUCCESSFULLY} for role: ${appliedRole}`
    );
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Skills ${Message.FETCH_SUCCESSFULLY} for role: ${appliedRole}`,
      skills
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch skills. ${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch skills.`
    );
  }
};

export const updateAppliedRoleAndSkill = async (req, res) => {
  const { id } = req.params;
  const { skill, appliedRole } = req.body;

  if (!skill && !appliedRole) {
    logger.warn('No fields provided for update');
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      'No fields provided for update'
    );
  }

  try {

    const existing = await appliedRoleModel.findOne({
      _id: { $ne: id },
      skill: { $regex: `^${skill.trim()}$`, $options: 'i' },
      appliedRole: { $regex: `^${appliedRole.trim()}$`, $options: 'i' },
      isDeleted: false,
    });

    if (existing) {
      logger.warn('Duplicate skill for the same applied role not allowed.');
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'This skill already exists for the given applied role.'
      );
    }

    const result = await updateAppliedRole(id, { skill, appliedRole });

    if (result.modifiedCount === 0) {
      logger.warn('No records were updated');
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'No record updated'
      );
    }

    logger.info(`Skills and Applied Role ${Message.UPDATED_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Skills and Applied Role ${Message.UPDATED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update skill.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update skill.`
    );
  }
};

export const getSkillsById = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await getSkillById(id);
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

  export const ViewAllSkillAndAppliedRole = async (req, res) => {
    try {
      let page = Math.max(1, parseInt(req.query.page)) || 1;
      let limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 10;
      let search = req.query.search || "";
  
      let data;
      let totalRecords;
  
      if (search) {
        const searchFields = ['skill'];
        const searchResult = await commonSearch(appliedRoleModel, searchFields, search,);
        data = searchResult.results;
        totalRecords = searchResult.totalRecords;
      } else {
        totalRecords = await appliedRoleModel.countDocuments({ isDeleted: false });
        data = await getAllSkillAndAppliedRole(page, limit);
      }
  
      logger.info(`All skills are ${Message.FETCH_SUCCESSFULLY}`);
      HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `All skills are ${Message.FETCH_SUCCESSFULLY}`,
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
      logger.error(`${Message.FAILED_TO} fetch skills.${error}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${Message.FAILED_TO} fetch skills.`
      );
    }
  };

export const deleteAppliedRoleAndSkill = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteSkill(id);

    if (result.deletedCount === 0) {
      logger.warn(`Skill is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Skill is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Skill is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Skill is ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`Failed to delete record. ${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete skills.`
    );
  }
};

export const findAndReplaceSkillOrAppliedRole = async (req, res) => {
  const { field, find, replaceWith } = req.body;

  if (!['skill', 'appliedRole'].includes(field)) {
    logger.warn(`Invalid field provided for find and replace`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Invalid field. Must be 'skill' or 'appliedRole'.`
    );
  }

  if (!find || !replaceWith) {
    logger.warn(`Find or replaceWith value is missing`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Both 'find' and 'replaceWith' values are required.`
    );
  }

  try {
    const regex = new RegExp(`^${find.trim()}$`, 'i');

    const result = await appliedRoleModel.updateMany(
      { [field]: regex, isDeleted: false },
      { $set: { [field]: replaceWith } }
    );

    if (result.modifiedCount === 0) {
      logger.info(`No matching records found to update`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `No matching records found to update.`,
        result
      );
    }

    logger.info(`${field} values replaced successfully`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `${field} values replaced successfully.`,
      result
    );
  } catch (error) {
    logger.error(`Failed to perform find and replace. ${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} perform find and replace.`
    );
  }
};

export const previewFindSkillOrAppliedRole = async (req, res) => {
  const { field, find } = req.body;

  if (!['skill', 'appliedRole'].includes(field)) {
    logger.warn(`Invalid field provided for preview`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Invalid field. Must be 'skill' or 'appliedRole'.`
    );
  }

  if (!find) {
    logger.warn(`Find value is missing`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `The 'find' value is required.`
    );
  }

  try {
    const regex = new RegExp(`^${find.trim()}$`, 'i');

    const results = await appliedRoleModel.find({
      [field]: regex,
      isDeleted: false,
    });

    if (!results.length) {
      logger.info(`No matching records found`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `No matching records found.`,
        []
      );
    }

    logger.info(`Preview: Found ${results.length} matching record(s)`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Found ${results.length} matching record(s).`,
      results
    );
  } catch (error) {
    logger.error(`Failed to perform preview find. ${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} preview find.`
    );
  }
};
