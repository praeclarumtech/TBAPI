import applicantStatus from "../models/applicantStatusModel.js";

export const create = async (body) => {
  try {
    const applicantStatuses = new applicantStatus({ ...body });
    return await applicantStatuses.save();
  } catch (error) {
    throw new Error(`Failed to create applicantStatus: ${error.message}`);
  }
};

export const getAllApplicantStatus = async (page, limit) => {
  try {
    return await applicantStatus.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    throw new Error(`Failed to fetch applicantStatus: ${error.message}`);
  }
};

export const getApplicantStatusById = async (id) => {
  try {
    return await applicantStatus.findOne({ _id: id, isDeleted: false });
  } catch (error) {
    throw new Error(`Failed to get applicantStatus by ID: ${error.message}`);
  }
};

export const updateApplicantStatus = async (id, updateData) => {
  try {
    return await applicantStatus.updateOne({ _id: id }, updateData);
  } catch (error) {
    throw new Error(`Failed to update applicantStatus: ${error.message}`);
  }
};

export const deleteApplicantStatusById = async (id) => {
  try {
    return await applicantStatus.deleteOne({ _id: id });
  } catch (error) {
    throw new Error(`Failed to delete applicantStatus: ${error.message}`);
  }
};

export const removeManyApplicantStatus = async (ids) => {
  try {
    return await applicantStatus.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    throw new Error(`Failed to delete multiple applicantStatus: ${error.message}`);
  }
};
