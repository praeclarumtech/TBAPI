import duplicateRecord from "../models/duplicateRecordModel.js";
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import logger from '../loggers/logger.js';

// export const create = async (body) => {
//   try {
//     const degree = new Degree({ ...body });
//     return await degree.save();
//   } catch (error) {
//     logger.error('Error while creating degree', error);
//     throw error;
//   }
// };

export const createDuplicateRecords = async (fileName) => {
  return await duplicateRecord.create({ fileName });
};

export const getAllDuplicateRecord = async (page, limit) => {
  try {
    return await duplicateRecord.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    logger.error('Error while fetching all duplicate Record', error);
    throw error;
  }
};

// export const getDegreeById = async (id) => {
//   try {
//     return await Degree.findOne({ _id: id, isDeleted: false });
//   } catch (error) {
//     logger.error('Error while fetching degree by ID', error);
//     throw error;
//   }
// };

// export const updateDegree = async (id, updateData) => {
//   try {
//     return await Degree.updateOne({ _id: id }, updateData);
//   } catch (error) {
//     logger.error('Error while updating degree', error);
//     throw error;
//   }
// };

export const removeDuplicateRecords = async (ids) => {
  try {
    return await duplicateRecord.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    logger.error('Error while deleting many duplicate record', error);
    throw error;
  }
};