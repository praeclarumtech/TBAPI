import mongoose from 'mongoose';
import TrainingTechnology from '../models/trainingTechnologyModel.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const findActiveByName = async (name, excludeId) => {
  const normalized = normalizeName(name);
  const records = await TrainingTechnology.find({ isDeleted: false }).select('name').lean();
  return records.find(
    (item) =>
      normalizeName(item.name) === normalized &&
      String(item._id) !== String(excludeId || '')
  );
};

export const listTrainingTechnologies = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const search = (req.query.search || '').toString().trim();
    const query = { isDeleted: false };

    if (search) {
      query.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const totalRecords = await TrainingTechnology.countDocuments(query);
    const data = await TrainingTechnology.find(query)
      .sort({ name: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Training technologies ${Message.FETCH_SUCCESSFULLY}`,
      {
        data,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: totalRecords ? Math.ceil(totalRecords / limit) : 0,
          limit,
        },
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch training technologies.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch training technologies.`
    );
  }
};

export const addTrainingTechnology = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
    const existing = await findActiveByName(name);
    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Technology ${Message.ALREADY_EXIST}`
      );
    }

    const created = await TrainingTechnology.create({ name });
    logger.info(`Training technology ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Technology ${Message.ADDED_SUCCESSFULLY}`,
      created
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add training technology.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add technology.`
    );
  }
};

export const updateTrainingTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, 'Invalid technology id.');
    }

    const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
    const existing = await findActiveByName(name, id);
    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `Technology ${Message.ALREADY_EXIST}`
      );
    }

    const updated = await TrainingTechnology.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { name } },
      { new: true }
    ).lean();

    if (!updated) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Technology ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Training technology ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Technology ${Message.UPDATED_SUCCESSFULLY}`,
      updated
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update training technology.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update technology.`
    );
  }
};

export const deleteTrainingTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, 'Invalid technology id.');
    }

    const deleted = await TrainingTechnology.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();

    if (!deleted) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Technology ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Training technology ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Technology ${Message.DELETED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete training technology.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete technology.`
    );
  }
};
