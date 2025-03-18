import Applicant from '../models/applicantModel.js';

export const createApplicant = async (body) => {
  const applicant = new Applicant({ ...body, addByManual: true });
  await applicant.save();
  return applicant;
};

export const createApplicants = async (applicantsArray) => {
  const applicants = await Applicant.insertMany(applicantsArray)
  return applicants
}

export const getAllapplicant = async () => {
  return Applicant.find();
};

export const getApplicantById = async (id) => {
  return Applicant.findById(id);
};

export const updateApplicantById = async (id, updateData) => {
  return Applicant.updateOne({ _id: id }, updateData);
};