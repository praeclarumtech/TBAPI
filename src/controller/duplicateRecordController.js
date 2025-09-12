import duplicateRecord from '../models/duplicateRecordModel.js';
import { getAllDuplicateRecord, removeDuplicateRecords } from '../services/duplicateRecordService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { commonSearch } from '../helpers/commonFunction/search.js';
import { Parser as Json2csvParser } from 'json2csv';

export const viewAllDuplicateRecord = async (req, res) => {
    try {
        let page = Math.max(1, parseInt(req.query.page)) || 1;
        let limit = Math.min(1000, Math.max(1, parseInt(req.query.limit)));
        let search = req.query.search || '';

        let item;
        let totalRecords;

        if (search) {
            const searchFields = ['fileName'];
            const searchResult = await commonSearch(duplicateRecord, searchFields, search,);
            item = searchResult.results;
            totalRecords = searchResult.totalRecords;
        } else {
            totalRecords = await duplicateRecord.countDocuments();
            item = await getAllDuplicateRecord(page, limit);
        }

        logger.info(`All duplicate Record are ${Message.FETCH_SUCCESSFULLY}`);
        HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `All duplicate Record are ${Message.FETCH_SUCCESSFULLY}`,
            {
                item,
                pagination: {
                    totalRecords: totalRecords,
                    currentPage: page,
                    totalPages: Math.ceil(totalRecords / limit),
                    limit: limit,
                },
            }
        );
    } catch (error) {
        logger.error(`${Message.FAILED_TO} fetch duplicate Record.`,error);
        return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            `${Message.FAILED_TO} fetch duplicate Record.`
        );
    }
};

export const deleteManyDuplicatrecords = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(`ObjectId is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Object Id not found'
      );
    }

    const removeDuplicateRecord = await removeDuplicateRecords(ids);

    if (removeDuplicateRecord.deletedCount === 0) {
      logger.warn(`Duplicate Record is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Duplicate Record is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Duplicate Record is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Duplicate Record is ${Message.DELETED_SUCCESSFULLY}`,
      removeDuplicateRecord
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleteMany duplicate Record.`,error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany duplicate Record.`
    );
  }
};

export const exportDuplicateRecords = async (req, res) => {
  try {
    const records = await duplicateRecord.find({}, {
      _id: 0,
      fileName: 1,
      reason: 1,
      createdAt: 1
    }).lean();

    const formattedRecords = records.map(record => ({
      Filename: record.fileName || '',
      Reason: record.reason || '',
      Date: record.createdAt || ''
    }));

    const fields = ['Filename', 'Reason', 'Date'];
    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(formattedRecords);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="duplicateRecords.csv" ');
    return res.status(200).end(csv);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} export duplicate records`)
    return res.status(500).json({ message: `${Message.FAILED_TO} export duplicate records` });
  }
};
