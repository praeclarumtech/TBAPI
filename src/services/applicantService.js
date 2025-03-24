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

export const getAllapplicant = async () => {
  return Applicant.find();
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
