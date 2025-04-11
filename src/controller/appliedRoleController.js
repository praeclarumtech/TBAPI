import appliedRoleModel from '../models/appliedRoleModel.js';
import Skills from '../models/skillsModel.js';
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
  const { appliedRole, skillIds } = req.body;

  if (
    !Array.isArray(skillIds) ||
    skillIds.length === 0 ||
    typeof appliedRole !== 'string' ||
    !appliedRole.trim()
  ) {
    logger.warn(`Skill IDs or appliedRole is ${Message.NOT_FOUND}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      `Skill IDs (array) or appliedRole ${Message.FIELD_REQUIRED}`
    );
  }

  try {
    const trimmedAppliedRole = appliedRole.trim();

    const skills = await Skills.find({
      _id: { $in: skillIds },
      isDeleted: false,
    });

    const skillNames = skills.map((skill) => skill.skills);

    if (!skillNames.length) {
      logger.warn('No valid skill names found for provided IDs');
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'No valid skills found for the provided skill IDs.'
      );
    }

    const existing = await appliedRoleModel.findOne({
      appliedRole: { $regex: `^${trimmedAppliedRole}$`, $options: 'i' },
      skill: {
        $in: skillNames.map((s) => new RegExp(`^${(s || '').trim()}$`, 'i')),
      },
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

    const result = await create({
      skill: skillNames,
      appliedRole: trimmedAppliedRole,
    });

    logger.info(`Skill is ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Skill is ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add skill. ${error}`);
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
        `skills ${Message.NOT_FOUND} for applied role: ${appliedRole}`
      );
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `skills ${Message.NOT_FOUND} for applied role: ${appliedRole}`,
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
  const { appliedRole, skillIds } = req.body;

  if (!id) {
    logger.warn('ID is required to update applied role and skill.');
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      'ID is required.'
    );
  }

  if (!appliedRole && (!Array.isArray(skillIds) || skillIds.length === 0)) {
    logger.warn('No data provided to update.');
    return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      'Nothing to update.'
    );
  }

  try {
    const updateData = {};

    if (appliedRole && typeof appliedRole === 'string') {
      updateData.appliedRole = appliedRole.trim();
    }

    if (Array.isArray(skillIds) && skillIds.length > 0) {
      const skills = await Skills.find({
        _id: { $in: skillIds },
        isDeleted: false,
      });
      const skillNames = skills.map((skill) => skill.skills);

      if (!skillNames.length) {
        logger.warn('Invalid skill IDs provided.');
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid skill IDs.'
        );
      }

      updateData.skill = skillNames;
    }

    if (updateData.appliedRole && updateData.skill) {
      const duplicate = await appliedRoleModel.findOne({
        _id: { $ne: id },
        appliedRole: { $regex: `^${updateData.appliedRole}$`, $options: 'i' },
        skill: {
          $in: updateData.skill.map((s) => new RegExp(`^${s.trim()}$`, 'i')),
        },
        isDeleted: false,
      });

      if (duplicate) {
        logger.warn('Duplicate combination found.');
        return HandleResponse(
          res,
          false,
          StatusCodes.CONFLICT,
          'Same applied role and skill combination already exists.'
        );
      }
    }

    const result = await updateAppliedRole(id, updateData);

    if (result.modifiedCount === 0) {
      logger.warn('No record updated.');
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'No record found or no changes made.'
      );
    }

    logger.info(`Applied role and skill ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applied role and skill ${Message.UPDATED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} update applied role and skill. ${error}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applied role and skill. ${error}`
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
    let search = req.query.search || '';

    let data;
    let totalRecords;

    if (search) {
      const searchFields = ['skill'];
      const searchResult = await commonSearch(
        appliedRoleModel,
        searchFields,
        search
      );
      data = searchResult.results;
      totalRecords = searchResult.totalRecords;
    } else {
      totalRecords = await appliedRoleModel.countDocuments({
        isDeleted: false,
      });
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
