import mongoose from 'mongoose';
import TrainingApplication from '../models/trainingApplicationModel.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';

const escapeRegex = (str) => (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fullName = (name = {}) =>
  [name.firstName, name.middleName, name.lastName].filter(Boolean).join(' ');

const normalizeTechnologies = (value) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
      ? value.split(',')
      : [];
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
};

export const submitTrainingApplication = async (req, res) => {
  try {
    const payload = applicationPayload(req.body);
    const existing = await TrainingApplication.findOne({
      isDeleted: false,
      phone: payload.phone,
      email: payload.email,
    }).sort({ createdAt: -1, _id: -1 });

    if (existing) {
      const updated = await TrainingApplication.findByIdAndUpdate(
        existing._id,
        { $set: payload },
        { new: true }
      );
      logger.info(`Training application ${Message.UPDATED_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Application updated successfully.',
        {
          _id: updated._id,
          fullName: fullName(updated.name),
        }
      );
    }

    const created = await TrainingApplication.create(payload);

    logger.info(`Training application ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      'Application submitted successfully.',
      {
        _id: created._id,
        fullName: fullName(created.name),
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} submit training application.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} submit application.`
    );
  }
};

export const listTrainingApplications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const search = (req.query.search || '').toString().trim();
    const {
      technology = '',
      semester = '',
      duration = '',
      gender = '',
      applicantType = '',
      state = '',
      city = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const query = { isDeleted: false };

    if (technology) {
      query.technology = {
        $regex: `^${escapeRegex(technology)}$`,
        $options: 'i',
      };
    }
    if (semester) query.semester = semester;
    if (duration) query.duration = duration;
    if (gender) query.gender = gender;
    if (applicantType) query.applicantType = applicantType;
    if (state) {
      query.state = { $regex: `^${escapeRegex(state)}$`, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
      if (!Object.keys(query.createdAt).length) delete query.createdAt;
    }

    if (search) {
      const wordConditions = search
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const pattern = { $regex: escapeRegex(word), $options: 'i' };
          return {
            $or: [
              { 'name.firstName': pattern },
              { 'name.middleName': pattern },
              { 'name.lastName': pattern },
              { email: pattern },
              { phone: pattern },
              { collegeName: pattern },
              { technology: pattern },
              { city: pattern },
              { state: pattern },
              { address: pattern },
            ],
          };
        });
      if (wordConditions.length) query.$and = wordConditions;
    }

    const totalRecords = await TrainingApplication.countDocuments(query);
    const data = await TrainingApplication.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Training applications ${Message.FETCH_SUCCESSFULLY}`,
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
    logger.error(`${Message.FAILED_TO} fetch training applications.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch training applications.`
    );
  }
};

const applicationPayload = (body) => ({
  name: {
    firstName: body.name.firstName.trim(),
    middleName: (body.name.middleName || '').trim(),
    lastName: body.name.lastName.trim(),
  },
  countryCode: (body.countryCode || '+91').trim(),
  phone: String(body.phone).trim(),
  email: (body.email || '').trim().toLowerCase(),
  technology: normalizeTechnologies(body.technology),
  collegeName: (body.collegeName || '').trim(),
  semester: body.semester || '',
  duration: body.duration,
  gender: body.gender,
  applicantType: body.applicantType,
  state: (body.state || '').trim(),
  city: (body.city || '').trim(),
  address: (body.address || '').trim(),
});

const invalidIdResponse = (res) =>
  HandleResponse(res, false, StatusCodes.BAD_REQUEST, 'Invalid application id.');

export const updateTrainingApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidIdResponse(res);

    const updated = await TrainingApplication.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: applicationPayload(req.body) },
      { new: true }
    ).lean();

    if (!updated) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Training application ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Training application ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Training application ${Message.UPDATED_SUCCESSFULLY}`,
      updated
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update training application.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update application.`
    );
  }
};

export const deleteTrainingApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidIdResponse(res);

    const deleted = await TrainingApplication.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();

    if (!deleted) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Training application ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Training application ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Training application ${Message.DELETED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete training application.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete application.`
    );
  }
};

export const viewTrainingApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid application id.'
      );
    }

    const application = await TrainingApplication.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!application) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Training application ${Message.NOT_FOUND}`
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Training application ${Message.FETCH_BY_ID}`,
      application
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch training application.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch training application.`
    );
  }
};
