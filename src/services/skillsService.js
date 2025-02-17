import Skills from "../models/skillsModel.js";

export const create = async (body) => {
  const skill = new Skills({ ...body });
  return skill.save();
};

export const getAllSkills = async (page, limit) => {
  return Skills.find()
    .skip((page - 1) * limit)
    .limit(limit);
};

export const getSkillById = async (id) => {
  return Skills.findById(id);
};

export const updateSkill = async (skillId, updateData) => {
  return Skills.findByIdAndUpdate(skillId, updateData, { new: true });
};

export const deleteSkillById = async (skillId) => {
  const skill = await Skills.findById(skillId);
  skill.isDeleted = true;
  await skill.save();

  return skill;
};
