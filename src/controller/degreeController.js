import Degree from '../models/degreeModel.js';
import {
    create,
    getAllDegree,
    getDegreeById,
    updateDegree,
    deleteDegreeById,
} from '../services/degreeService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';

export const addDegree = async (req, res) => {
    const { degree } = req.body;
    if (!degree || typeof degree !== "string") {
        logger.warn(`degree is ${Message.NOT_FOUND}`);
        return HandleResponse(
            res,
            false,
            StatusCodes.BAD_REQUEST,
            `Degree ${Message.FIELD_REQUIRED}`
        );
    }
    try {
        const existingDegree = await Degree.findOne({ degree });
        if (existingDegree) {
            return HandleResponse(
                res,
                false,
                StatusCodes.CONFLICT,
                `Degree ${Message.ALREADY_EXIST}: ${degree}`
            );
        }

        const result = await create({ degree });
        logger.info(`Degree is ${Message.ADDED_SUCCESSFULLY}`);
        HandleResponse(
            res,
            true,
            StatusCodes.CREATED,
            `Degree is ${Message.ADDED_SUCCESSFULLY}`,
            result
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} add degree.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} add degree.`
        );
    }
};

export const getDegrees = async (req, res) => {
    try {
        let page = Math.max(1, parseInt(req.query.page)) || 1;
        let limit = Math.min(100, Math.max(1, parseInt(req.query.limit))) || 10;
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

        logger.info(`All degrees are ${Message.FETCH_SUCCESSFULLY}`);
        HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `All degrees are ${Message.FETCH_SUCCESSFULLY}`,
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
        logger.error(`${Message.FAILED_TO} fetch degrees.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} fetch degrees.`
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
                `Degree is ${Message.NOT_FOUND}`
            );
        }
        logger.info(`Degree is ${Message.FETCH_BY_ID}`);
        return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `Degree is ${Message.FETCH_BY_ID}`,
            result
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} fetch degree by id.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} fetch degree by id.`
        );
    }
};

export const updateDegreebyId = async (req, res) => {
    try {
        const { degreeId } = req.params;
        const updateData = req.body;

        const updateddegree = await updateDegree(degreeId, updateData);

        if (!updateddegree) {
            logger.warn(`Degree is ${Message.NOT_FOUND}`);
            return HandleResponse(
                res,
                false,
                StatusCodes.NOT_FOUND,
                `Degree is ${Message.NOT_FOUND}`
            );
        }
        logger.info(`Degree is ${Message.UPDATED_SUCCESSFULLY}`);
        return HandleResponse(
            res,
            true,
            StatusCodes.ACCEPTED,
            `Degree is ${Message.UPDATED_SUCCESSFULLY}`,
            updateddegree
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} update degree.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} update degree.`
        );
    }
};

export const deleteDegree = async (req, res) => {
    try {
        const { degreeId } = req.params;
        const deletedDegree = await deleteDegreeById(degreeId, {
            isDeleted: true,
        });

        if (!deletedDegree) {
            logger.warn(`Degree is ${Message.NOT_FOUND}`)
            return HandleResponse(
                res,
                false,
                StatusCodes.NOT_FOUND,
                `Degree is ${Message.NOT_FOUND}`
            );
        }
        logger.info(`Degree is ${Message.DELETED_SUCCESSFULLY}`);
        return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `Degree is ${Message.DELETED_SUCCESSFULLY}`,
            deletedDegree
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} delete degree.`);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} delete degree.`
        );
    }
};