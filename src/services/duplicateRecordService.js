import duplicateRecord from "../models/duplicateRecordModel.js";
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import logger from '../loggers/logger.js';

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

export const removeDuplicateRecords = async (ids) => {
  try {
    return await duplicateRecord.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    logger.error('Error while deleting many duplicate record', error);
    throw error;
  }
};