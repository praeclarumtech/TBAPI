import Applicant from '../models/applicantModel.js';
import { commonSearch } from '../helpers/commonFunction/search.js';

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
  return Applicant.updateOne({_id: id}, updateData);
};

export const searchApplicantsService = async (query) => {
  return await commonSearch(Applicant, ['name.firstName', 'name.middleName', 'name.lastName', 'appliedSkills'], query, );
};