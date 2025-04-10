import appliedRoleModel from '../models/appliedRoleModel.js';

export const create = async (body) => {
  const { skill, appliedRole } = body;
  const skills = new appliedRoleModel({ skill, appliedRole });
  return skills.save();
};

export const getSkillsByAppliedRole = async (appliedRole) => {
  return appliedRoleModel.find({
    appliedRole: { $regex: `^${appliedRole.trim()}$`, $options: 'i' },
    isDeleted: false,
  });
};

export const getAllSkillAndAppliedRole = async (page, limit) => {
  return appliedRoleModel.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const updateAppliedRole = async (id, updateData) => {
  return appliedRoleModel.updateOne({ _id: id }, updateData);
};

export const deleteSkill = async (id) => { 
    return appliedRoleModel.deleteOne({ _id: id });
  };

export const getSkillById = async (id) => {
    return appliedRoleModel.findOne({ _id: id, isDeleted: false });
  };
