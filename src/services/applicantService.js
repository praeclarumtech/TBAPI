import Applicant from '../models/applicantModel.js';
import ExportsApplicants from '../models/exportsApplicantsModel.js';
import logger from '../loggers/logger.js';

export const createApplicant = async (body) => {
  const applicant = new Applicant({ ...body });
  await applicant.save();
  return applicant;
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

export const updateManyApplicants = async (applicantsArray) => {
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
  return Applicant.findById(id);
};

export const updateApplicantById = async (id, updateData) => {
  return Applicant.updateOne({ _id: id }, updateData);
};

export const removeManyApplicants = async (ids) => {
  return await Applicant.deleteMany({ _id: { $in: ids } });
};

export const findApplicantByField = async (field, value) => {
  return await Applicant.findOne({ [field]: value });
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
  return ExportsApplicants.findById(id);
};

export const updateExportsApplicantById = async (id, updateData) => {
  return ExportsApplicants.updateOne({ _id: id }, updateData);
};

export const hardDeleteExportsApplicantById = async (id) => {
  return ExportsApplicants.deleteOne({ _id: id });
};

export const removeManyExportsApplicants = async (ids) => {
  return await ExportsApplicants.deleteMany({ _id: { $in: ids } });
};
