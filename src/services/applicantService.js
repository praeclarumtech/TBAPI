import Applicant from '../models/applicantModel.js';
import ExportsApplicants from '../models/exportsApplicantsModel.js';
import Skills from '../models/skillsModel.js';
import appliedRoleModel from '../models/appliedRoleModel.js';
import logger from '../loggers/logger.js';

export const createApplicant = async (body) => {
  try{
  const applicant = new Applicant({ ...body });
  await applicant.save();
  return applicant;
  } catch (error){
    logger.error('Error while creating applicant', error);
    throw error;
  }
};

export const createApplicantByResume = async (body) => {
  try {
    const applicant = new ExportsApplicants({ ...body });
    await applicant.save();
    return applicant;
  } catch (error) {
    logger.error('error while add applicant by resume', error);
    throw error;
  }
};

export const insertManyApplicants = async (applicantsArray) => {
  try {
    return await ExportsApplicants.bulkWrite(
      applicantsArray.map((applicant) => ({
        insertOne: { document: applicant },
      }))
    );
  } catch (error) {
    logger.error('error while insertMany applicants', error);
    throw error;
  }
};

export const UpdateManyApplicantsByImport = async (applicantsArray) => {
  try {
    return await ExportsApplicants.bulkWrite(
      applicantsArray.map((applicant) => ({
        updateOne: {
          filter: { email: applicant.email.trim().toLowerCase() },
          update: { $set: applicant },
          upsert: true,
        },
      }))
    );
  } catch (error) {
    logger.error('error while updating applicants', error);
    throw error;
  }
};

export const deleteExportedApplicants = async (query) => {
  try {
    return await ExportsApplicants.deleteMany(query);
  } catch (error) {
    logger.error('error while deleting exported applicants', error);
    throw error;
  }
};

export const insertManyApplicantsToMain = async (applicantsArray) => {
  try {
    return await Applicant.insertMany(applicantsArray);
  } catch (error) {
    logger.error('error while inserting applicants to main', error);
    throw error;
  }
};

export const getAllapplicant = async (query) => {
  try {
    return await ExportsApplicants.find(query);
  } catch (error) {
    logger.error('error while fetching all applicants', error);
    throw error;
  }
};

export const getApplicantById = async (id) => {
  try{
  return Applicant.findById(id);
  } catch(error) {
    logger.error('Error while getting applicant by ID', error);
    throw error;
  }
};

export const updateApplicantById = async (id, updateData) => {
  try{
  return Applicant.updateOne({ _id: id }, updateData);
  } catch(error){
    logger.error('Error while updating applicant by ID', error);
    throw error;
  }
};

export const removeManyApplicants = async (ids) => {
  try {
    return await Applicant.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    logger.error('Error while removing many applicants', error);
    throw error;
  }
};

export const findApplicantByField = async (field, value) => {
  try {
    return await Applicant.findOne({ [field]: value });
  } catch (error) {
    logger.error(`Error while finding applicant by field ${field}`, error);
    throw error;
  }
};

export const updateManyApplicantsService = async (applicantIds, updateData) => {
  try {
    const result = await ExportsApplicants.updateMany(
      { _id: { $in: applicantIds } },
      { $set: updateData }
    );
    return result;
  } catch (error) {
    throw new Error('Failed to update multiple applicants: ' + error.message);
  }
};

export const getExportsApplicantById = async (id) => {
  try {
    return await ExportsApplicants.findById(id);
  } catch (error) {
    logger.error('Error while getting exports applicant by ID', error);
    throw error;
  }
};

export const updateExportsApplicantById = async (id, updateData) => {
  try {
    return await ExportsApplicants.updateOne({ _id: id }, updateData);
  } catch (error) {
    logger.error('Error while updating exports applicant by ID', error);
    throw error;
  }
};

export const hardDeleteExportsApplicantById = async (id) => {
  try {
    return await ExportsApplicants.deleteOne({ _id: id });
  } catch (error) {
    logger.error('Error while hard deleting exports applicant by ID', error);
    throw error;
  }
};

export const removeManyExportsApplicants = async (ids) => {
  try {
    return await ExportsApplicants.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    logger.error('Error while removing many exports applicants', error);
    throw error;
  }
};


export const AddManyApplicantsByImport = async (body) => {
  try {
    const applicant = new ExportsApplicants({ ...body });
    return await applicant.save();
  } catch (error) {
    throw new Error('Failed to update multiple applicants: ' + error);
  }
};

export const extractSkillsFromResume = async (resumeText) => {
  try {
    if (!resumeText) {
      throw new Error('Resume text is empty');
    }

    const skillDocs = await Skills.find({ isDeleted: false })
      .select('skills -_id')
      .lean();

    const skillWordList = skillDocs.map((doc) => doc.skills);
    const lowerCaseText = resumeText.toLowerCase();

    const escapeRegex = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const matchedSkills = skillWordList.filter((skill) => {
      const skillRegex = new RegExp(
        `\\b${escapeRegex(skill.toLowerCase())}\\b`,
        'i'
      );
      return skillRegex.test(lowerCaseText);
    });

    return matchedSkills.join(', ');
  } catch (error) {
    logger.error(`Failed to extract skills from resume: ${error.message}`);
    return [];
  }
};

const escapeRegex = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractMatchingRoleFromResume = async (resumeText) => {
  try {
    if (!resumeText) {
      throw new Error('Resume text is empty');
    }

    const appliedRoles = await appliedRoleModel
      .find({ isDeleted: false })
      .select('appliedRole -_id')
      .lean();

    const normalize = (text) => text.toLowerCase().replace(/[\s\-_]+/g, '');

    const escapeRegex = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const cleanResumeText = normalize(resumeText);

    const matchedRole = appliedRoles.find((doc) => {
      const roleNormalized = normalize(doc.appliedRole);
      const regex = new RegExp(escapeRegex(roleNormalized), 'i');
      return regex.test(cleanResumeText);
    });

    return matchedRole?.appliedRole || 'Software Engineer';
  } catch (error) {
    logger.error(
      `Failed to extract applied role from resume: ${error.message}`
    );
    return 'Software Engineer';
  }
};


export const activateApplicant = async (applicantId) => {
  try {
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) throw new Error('Applicant not found');
 
    applicant.isActive = true;
    return await applicant.save();
  } catch (error) {
    logger.error('Error in activateApplicant', error);
    throw error;
  }
};
 
export const inActivateApplicant = async (applicantId) => {
  try {
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) throw new Error('Applicant not found');
 
    applicant.isActive = false;
    return await applicant.save();
  } catch (error) {
    logger.error('Error in inActivateApplicant', error);
    throw error;
  }
}
 