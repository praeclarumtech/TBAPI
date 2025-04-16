import appliedRoleModel from '../models/appliedRoleModel.js';
import Skills from '../models/skillsModel.js';
import Degree from '../models/degreeModel.js';

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
  return appliedRoleModel
    .find({ isDeleted: false })
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

export const findAndReplaceFieldValue = async (field, find, replaceWith) => {
  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const findArray = Array.isArray(find) ? find : [find];
  const replaceArray = Array.isArray(replaceWith) ? replaceWith : [replaceWith];

  if (findArray.length !== replaceArray.length) {
    throw new Error('Length of find and replaceWith arrays must be equal.');
  }

  const results = [];
  let totalModified = 0;

  for (let i = 0; i < findArray.length; i++) {
    const findValue = findArray[i].trim();
    const replaceValue = replaceArray[i].trim();
    const regex = new RegExp(`^${escapeRegex(findValue)}$`, 'i');

    let result;

    if (field === 'skills') {
      result = await Skills.updateMany(
        { skills: regex, isDeleted: false },
        { $set: { skills: replaceValue } }
      );
    } else if (field === 'appliedRole') {
      result = await appliedRoleModel.updateMany(
        { appliedRole: regex, isDeleted: false },
        { $set: { appliedRole: replaceValue } }
      );
    } else if (field === 'degree') {
      result = await Degree.updateMany(
        { degree: regex, isDeleted: false },
        { $set: { degree: replaceValue } }
      );
    } else {
      throw new Error('Unsupported field for find and replace');
    }

    const modifiedCount = result.modifiedCount ?? result.nModified ?? 0;
    totalModified += modifiedCount;
    results.push(`Replaced ${findValue} in ${modifiedCount} records with ${replaceValue}`);
  }

  return {results,totalModified };
};

export const previewFindFieldValue = async (field, find) => {
  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const findTerms = Array.isArray(find)
    ? find
    : find.split(',').map((item) => item.trim()).filter(Boolean);

    const results = [];
    let totalMatched = 0;

    for (const term of findTerms) {
      const regex = new RegExp(`^${escapeRegex(term)}$`, 'i');
      const query = {
        [field]: { $in: [regex] },
        isDeleted: false,
      };
  
      let count = 0;

      if (field === 'appliedRole') {
        count = await appliedRoleModel.countDocuments(query);
      } else if (field === 'skills') {
        count = await Skills.countDocuments(query);
      } else if (field === 'degree') {
        count = await Degree.countDocuments(query);
      } else {
        throw new Error('Unsupported field for find');
      }
      results.push(`${term} matched count: ${count}`);
      totalMatched += count;
}
return {results, totalMatched};
};
