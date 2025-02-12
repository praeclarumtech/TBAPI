import Applicant from "../models/applicantModel.js";

export const createApplicant = async (body) => {
  const applicant = new Applicant({ ...body });
  await applicant.save();
  return applicant;
};

export const getAllapplicant = async () => {
  return Applicant.find();
};

export const getApplicantById = async (id) => {
  return Applicant.findById(id);
};

export const updateApplicantById = async (id, updateData) => {
  return Applicant.findByIdAndUpdate(id, updateData);
};

export const deleteApplicantById = async (id, excludeDeleted = true) => {
  const filter = excludeDeleted ? { _id: id, isDeleted: false } : { _id: id };
  return await Applicant.findOne(filter);
};
