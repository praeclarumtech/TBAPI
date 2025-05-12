import Degree from '../models/degreeModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import logger from '../loggers/logger.js';

export const create = async (body) => {
  try {
    const degree = new Degree({ ...body });
    return await degree.save();
  } catch (error) {
    logger.error('Error while creating degree', error);
    throw error;
  }
};

export const getAllDegree = async (page, limit) => {
  try {
    return await Degree.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    logger.error('Error while fetching all degrees', error);
    throw error;
  }
};

export const getDegreeById = async (id) => {
  try {
    return await Degree.findOne({ _id: id, isDeleted: false });
  } catch (error) {
    logger.error('Error while fetching degree by ID', error);
    throw error;
  }
};

export const updateDegree = async (id, updateData) => {
  try {
    return await Degree.updateOne({ _id: id }, updateData);
  } catch (error) {
    logger.error('Error while updating degree', error);
    throw error;
  }
};

export const deleteManyDegrees = async (ids) => {
  try {
    return await Degree.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    logger.error('Error while deleting degrees', error);
    throw error;
  }
};