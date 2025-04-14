import appliedRoleModel from '../models/appliedRoleModel.js';
import Applicant from '../models/applicantModel.js';

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
  const regex = new RegExp(`^${escapeRegex(find.trim())}$`, 'i');

  if (field === 'skill') {
    return appliedRoleModel.updateMany(
      {
        skill: regex,
        isDeleted: false,
      },
      {
        $set: {
          'skill.$[elem]': replaceWith,
        },
      },
      {
        arrayFilters: [{ elem: regex }],
      }
    );
  } else if (field === 'appliedRole') {
    return appliedRoleModel.updateMany(
      {
        appliedRole: regex,
        isDeleted: false,
      },
      {
        $set: { appliedRole: replaceWith },
      }
    );
  } else if (field === 'appliedSkills') {
    return Applicant.updateMany(
      {
        appliedSkills: regex,
        isDeleted: false,
      },
      {
        $set: {
          'appliedSkills.$[elem]': replaceWith,
        },
      },
      {
        arrayFilters: [{ elem: regex }],
      }
    );
  } else if (field === 'currentCompanyDesignation') {
    return Applicant.updateMany(
      {
        currentCompanyDesignation: regex,
        isDeleted: false,
      },
      {
        $set: { currentCompanyDesignation: replaceWith },
      }
    );
  } else if (field === 'qualification') {
    return Applicant.updateMany(
      {
        qualification: regex,
        isDeleted: false,
      },
      {
        $set: { qualification: replaceWith },
      }
    );
  } else {
    throw new Error('Unsupported field for find and replace');
  }
};

export const previewFindFieldValue = async (field, find) => {
  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  const regex = new RegExp(`^${escapeRegex(find.trim())}$`, 'i');

  if (field === 'skill' || field === 'appliedRole') {
    return appliedRoleModel.find({
      [field]: regex,
      isDeleted: false,
    });
  } else if (
    field === 'appliedSkills' ||
    field === 'currentCompanyDesignation' ||
    field === 'qualification'
  ) {
    return Applicant.find({
      [field]: regex,
      isDeleted: false,
    });
  } else {
    throw new Error('Unsupported field for find');
  }
};
