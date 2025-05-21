import appliedRoleModel from '../models/appliedRoleModel.js';
import Skills from '../models/skillsModel.js';
import Degree from '../models/degreeModel.js';
import logger from '../loggers/logger.js';
import Applicant from '../models/applicantModel.js';

export const create = async (body) => {
  try {
    const { skill, appliedRole } = body;
    const skills = new appliedRoleModel({ skill, appliedRole });
    return await skills.save();
  } catch (error) {
    logger.error('Error while creating applied role', error);
    throw error;
  }
};

export const getSkillsByAppliedRole = async (appliedRole) => {
  try {
    return await appliedRoleModel.find({
      appliedRole: { $regex: `^${appliedRole.trim()}$`, $options: 'i' },
      isDeleted: false,
    });
  } catch (error) {
    logger.error('Error while fetching skills by applied role', error);
    throw error;
  }
};

export const getAllSkillAndAppliedRole = async (page, limit) => {
  try {
    return await appliedRoleModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    logger.error('Error while fetching all skills and applied roles', error);
    throw error;
  }
};

export const updateAppliedRole = async (id, updateData) => {
  try {
    return await appliedRoleModel.updateOne({ _id: id }, updateData);
  } catch (error) {
    logger.error('Error while updating applied role', error);
    throw error;
  }
};

export const deleteSkill = async (id) => {
  try {
    return await appliedRoleModel.deleteOne({ _id: id });
  } catch (error) {
    logger.error('Error while deleting applied role skill', error);
    throw error;
  }
};

export const getSkillById = async (id) => {
  try {
    return await appliedRoleModel.findOne({ _id: id, isDeleted: false });
  } catch (error) {
    logger.error('Error while getting applied role skill  by ID', error);
    throw error;
  }
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
    const regex = new RegExp(`^${escapeRegex(findValue)}$`);

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
    }else if (field === 'appliedSkills') {
      result = await Applicant.updateMany(
        {
          appliedSkills: regex,
          isDeleted: false
        },
        [
          {
            $set: {
              appliedSkills: {
                $map: {
                  input: '$appliedSkills',
                  as: 'skill',
                  in: {
                    $cond: [
                      { $regexMatch: { input: '$$skill', regex: regex } },
                      replaceValue,
                      '$$skill'
                    ]
                  }
                }
              }
            }
          }
        ]
      );} 
    else {
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
      const regex = new RegExp(`^${escapeRegex(term)}$`);
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
      }else if (field === 'appliedSkills') {
        count = await Applicant.countDocuments(query);
      } else {
        throw new Error('Unsupported field for find');
      }
      results.push(`${term} matched count: ${count}`);
      totalMatched += count;
}
return {results, totalMatched};
};
