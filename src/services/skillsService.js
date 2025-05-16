import Skills from '../models/skillsModel.js';
import logger from '../loggers/logger.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';

export const create = async (body) => {
  try {
    const skill = new Skills({ ...body });
    return await skill.save();
  } catch (error) {
    logger.error('Error while creating skill', error);
    throw error;
  }
};

export const getAllSkills = async (page, limit) => {
  try {
    return await Skills.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    logger.error('Error while fetching all skills', error);
    throw error;
  }
};

export const getSkillById = async (id) => {
  try {
    return await Skills.findOne({ _id: id, isDeleted: false });
  } catch (error) {
    logger.error('Error while fetching skill by ID', error);
    throw error;
  }
};

export const updateSkill = async (id, updateData) => {
  try {
    return await Skills.updateOne({ _id: id }, updateData);
  } catch (error) {
    logger.error('Error while updating skill', error);
    throw error;
  }
};

export const deleteSkillById = async (id) => {
  try {
    return await Skills.updateOne({ _id: id }, { isDeleted: true });
  } catch (error) {
    logger.error('Error while soft deleting skill by ID', error);
    throw error;
  }
};