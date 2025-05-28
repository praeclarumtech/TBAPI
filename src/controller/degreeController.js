import Degree from '../models/degreeModel.js';
import {
    create,
    getAllDegree,
    getDegreeById,
    updateDegree,
    deleteManyDegrees,
} from '../services/degreeService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';

export const addDegree = async (req, res) => {
    const { degree } = req.body;
    if (!degree || typeof degree !== "string") {
        logger.warn(`Qualification ${Message.NOT_FOUND}`);
        return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            `Qualification ${Message.FIELD_REQUIRED}`
        );
    }
    try {
        const existingDegree = await Degree.findOne({ degree });
        if (existingDegree) {
            return HandleResponse(
                res,
                false,
                StatusCodes.CONFLICT,
                `Qualification ${Message.ALREADY_EXIST}: ${degree}`
            );
        }

        const result = await create({ degree });
        logger.info(`Qualification ${Message.ADDED_SUCCESSFULLY}`);
        HandleResponse(
            res,
            true,
            StatusCodes.CREATED,
            `Qualification ${Message.ADDED_SUCCESSFULLY}`,
            result
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} add qualification.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} add qualification.`
        );
    }
};

export const getDegrees = async (req, res) => {
    try {
        let page = Math.max(1, parseInt(req.query.page)) || 1;
        let limit = Math.min(800, Math.max(1, parseInt(req.query.limit))) || 10;
        let search = req.query.search || "";

        let data;
        let totalRecords;

        if (search) {
            const searchFields = ['degree'];
            const searchResult = await commonSearch(Degree, searchFields, search,);
            data = searchResult.results;
            totalRecords = searchResult.totalRecords;
        } else {
            totalRecords = await Degree.countDocuments({ isDeleted: false });
            data = await getAllDegree(page, limit);
        }

        logger.info(`All qualification are ${Message.FETCH_SUCCESSFULLY}`);
        HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `All qualification are ${Message.FETCH_SUCCESSFULLY}`,
            {
                data,
                pagination: {
                    totalRecords: totalRecords,
                    currentPage: page,
                    totalPages: Math.ceil(totalRecords / limit),
                    limit: limit,
                },
            }
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} fetch qualification.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} fetch qualification.`
        );
    }
};

export const getSingleDegree = async (req, res) => {
    const { degreeId } = req.params;
    try {
        const result = await getDegreeById(degreeId);
        if (!result) {
            return HandleResponse(
                res,
                false,
                StatusCodes.NOT_FOUND,
                `Qualification ${Message.NOT_FOUND}`
            );
        }
        logger.info(`Qualification ${Message.FETCH_BY_ID}`);
        return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `Qualification ${Message.FETCH_BY_ID}`,
            result
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} fetch qualification by id.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} fetch qualification by id.`
        );
    }
};

export const updateDegreebyId = async (req, res) => {
    try {
        const { degreeId } = req.params;
        const updateData = req.body;

        const updateddegree = await updateDegree(degreeId, updateData);

        if (!updateddegree) {
            logger.warn(`Qualification ${Message.NOT_FOUND}`);
            return HandleResponse(
                res,
                false,
                StatusCodes.NOT_FOUND,
                `Qualification ${Message.NOT_FOUND}`
            );
        }
        logger.info(`Qualification ${Message.UPDATED_SUCCESSFULLY}`);
        return HandleResponse(
            res,
            true,
            StatusCodes.ACCEPTED,
            `Qualification ${Message.UPDATED_SUCCESSFULLY}`,
            updateddegree
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} update qualification.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} update qualification.`
        );
    }
};

export const deleteDegree = async (req, res) => {
  try {
    const { ids } = req.body;
 
    let idsToDelete = [];
 
    if (Array.isArray(ids)) {
      // If array of full objects or array of strings
      idsToDelete = ids.map(item => typeof item === 'object' && item._id ? item._id : item);
    } else if (typeof ids === 'object' && ids._id) {
      // Single object
      idsToDelete = [ids._id];
    } else if (typeof ids === 'string') {
      // Single string ID
      idsToDelete = [ids];
    }
 
    if (!idsToDelete.length) {
      logger.warn(`Invalid ids received: ${JSON.stringify(ids)}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `ObjectId ${Message.NOT_FOUND}`
      );
    }
 
    const deletedDegree = await deleteManyDegrees(idsToDelete);
 
    if (deletedDegree.deletedCount === 0) {
      logger.warn(`Qualification ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Qualification is not found from given id(s)`
      );
    }
 
    logger.info(`Qualification ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Qualification ${Message.DELETED_SUCCESSFULLY}`,
      deletedDegree
    );
  } catch (error) {
    console.error("Error in deleteDegree controller:", error);
    logger.error(`${Message.FAILED_TO} delete qualification.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete qualification.`
    );
  }
};