import Skills from '../models/skillsModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';

export const create = async (body) => {
  const { skills, category } = body;
  const skill = new Skills({ skills, category });
  return skill.save();
};
export const getAllSkills = async (page, limit) => {
  return Skills.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const getSkillById = async (id) => {
  return Skills.findOne({ _id: id, isDeleted: false });
};

export const updateSkill = async (id, updateData) => {
  return Skills.updateOne({_id: id}, updateData);
};
 
export const deleteSkillById = async (id) => {
  return Skills.updateOne({_id: id}, { isDeleted: true });
};

export const deleteSkillPermanently = async (id) => {
  return Skills.deleteOne({ _id: id });
};
