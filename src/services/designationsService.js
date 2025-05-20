import designations from '../models/designationModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import logger from '../loggers/logger.js';

export const create = async (body) => {
  try {
    const designation = new designations({ ...body });
    return await designation.save();
  } catch (error) {
    logger.error('Error while creating designation', error);
    throw error;
  }
};

export const getAllDesignation = async (page, limit) => {
  try {
    return await designations.find({ isDeleted: false })
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    logger.error('Error while fetching all designations', error);
    throw error;
  }
};

export const getDesignationById = async (id) => {
  try {
    return await designations.findOne({ _id: id, isDeleted: false });
  } catch (error) {
    logger.error('Error while fetching designation by ID', error);
    throw error;
  }
};

export const updateDesignation = async (id, updateData) => {
  try {
    return await designations.updateOne({ _id: id }, updateData);
  } catch (error) {
    logger.error('Error while updating designation', error);
    throw error;
  }
};

export const deleteDesignationById = async (id) => {
  try {
    return await designations.deleteOne({ _id: id });
  } catch (error) {
    logger.error('Error while deleting designation by ID', error);
    throw error;
  }
};

export const removeManyDesignation = async (ids) => {
  try {
    return await designations.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    logger.error('Error while deleting many designations', error);
    throw error;
  }
};