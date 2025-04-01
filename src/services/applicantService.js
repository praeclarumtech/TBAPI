import Applicant from '../models/applicantModel.js';

export const createApplicant = async (body) => {
  const applicant = new Applicant({ ...body });
  await applicant.save();
  return applicant;
};

export const insertManyApplicants = async (applicantsArray) => {
  return await Applicant.bulkWrite(
    applicantsArray.map((applicant) => ({
      insertOne: { document: applicant },
    }))
  );
};

export const updateManyApplicants = async (applicantsArray) => {
  return await Applicant.bulkWrite(
    applicantsArray.map((applicant) => ({
      updateOne: {
        filter: { email: applicant.email.trim().toLowerCase() },
        update: { $set: applicant },
        upsert: true,
      },
    }))
  );
};

export const getAllapplicant = async (query) => {
  return Applicant.find(query);
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

export const updateManyApplicantsService = async (applicantIds, updateData) => 
  {
  try {
    const result = await Applicant.updateMany(
      { _id: { $in: applicantIds } },
      { $set: updateData },
    );
    return result;
  } catch (error) {
    throw new Error('Failed to update multiple applicants: ' + error.message);
  }
};
