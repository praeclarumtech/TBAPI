import {
  createApplicant,
  getApplicantById,
  updateApplicantById,
  deleteApplicantById,
} from '../services/applicantService.js';
import { Message } from '../utils/message.js';
import logger from '../loggers/logger.js';
import { generateApplicantNo } from '../helpers/generateApplicationNo.js';
import Applicant from '../models/applicantModel.js';
import { pagination } from '../helpers/commonFunction/passingYearPagination.js';

export const addApplicant = async (req, res) => {
  try {
    const {
      name: { first, middle, last },
      ...body
    } = req.body;
    const application_No = await generateApplicantNo();
    const applicantData = {
      application_No,
      name: { first, middle, last },
      ...body,
    };
    const applicant = await createApplicant(applicantData);
    logger.info(`${Message.APPLICANT_SUBMIT_SUCCESSFULLY}: ${applicant._id}`);
    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    logger.error(`${Message.ERROR_ADDING_AAPLICANT}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ message: Message.ERROR_ADDING_AAPLICANT, error });
  }
};

export const viewAllApplicant = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      application_No,
      applied_Skills,
      total_Exp,
      startDate,
      endDate,
    } = req.body;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    let query = { isDeleted: false };

    if (application_No && !isNaN(application_No)) {
      query.application_No = parseInt(application_No);
    }

    if (
      applied_Skills &&
      Array.isArray(applied_Skills) &&
      applied_Skills.length > 0
    ) {
      query.applied_Skills = { $in: applied_Skills };
    }

    if (total_Exp && !isNaN(total_Exp)) {
      query.total_Exp = parseInt(total_Exp);
      // query.total_Exp = { $gte: parseInt(total_Exp) };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate)
        query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const findYears = await pagination({
      Schema: Applicant,
      page: pageNum,
      limit: limitNum,
      query,
    });

    res.status(200).json({
      success: true,
      message: Message.FETCHED_APPLICANT_SUCCESSFULLY,
      data: {
        item: findYears.getYears,
        totalRecords: findYears.totalRecords,
        currentPage: pageNum,
        totalPages:
          findYears.totalRecords && limitNum > 0
            ? Math.ceil(findYears.totalRecords / limitNum)
            : 0,
        limit: limitNum,
      },
    });
  } catch (error) {
    logger.error(`${Message.ERROR_RETRIEVING_APPLICANTS}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: Message.ERROR_RETRIEVING_APPLICANTS,
      error,
    });
  }
};

export const viewApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await getApplicantById(applicantId);

    if (!applicant) {
      logger.warn(`${Message.APPLICANT_NOT_FOUND}: ${applicantId}`);
      return res.status(404).json({ message: Message.APPLICANT_NOT_FOUND });
    }
    logger.info(`${Message.FETCHED_APPLICANT_SUCCESSFULLY}: ${applicantId}`);
    res.json(applicant);
  } catch (error) {
    logger.error(`${Message.ERROR_RETRIEVING_APPLICANTS}: ${error.message}`, {
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: Message.ERROR_RETRIEVING_APPLICANTS, error });
  }
};

export const updateApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const {
      name: { first, middle, last },
      ...body
    } = req.body;

    let updateData = { name: { first, middle, last }, ...body };
    const updatedApplicant = await updateApplicantById(applicantId, updateData);

    if (!updatedApplicant) {
      logger.warn(`${Message.USER_NOT_FOUND}: ${applicantId}`);
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    logger.info(`${Message.UPDATED_SUCCESSFULLY}: ${applicantId}`);
    res.json(updatedApplicant);
  } catch (error) {
    logger.error(`${Message.ERROR_UPDATING_APPLICANT}: ${error.message}`);
    res.status(500).json({ message: Message.ERROR_UPDATING_APPLICANT, error });
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await deleteApplicantById(applicantId, false);

    if (!applicant) {
      logger.warn(`${Message.APPLICANT_NOT_FOUND}: ${applicantId}`);
      return res.status(404).json({ message: Message.APPLICANT_NOT_FOUND });
    }
    applicant.isDeleted = true;
    await applicant.save();

    logger.info(`${Message.APPLICANT_DELETED_SUCCESSFULLY}: ${applicantId}`);
    res.json({ message: Message.APPLICANT_DELETED_SUCCESSFULLY });
  } catch (error) {
    logger.error(`${Message.ERROR_DELETING_APPLICANT}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ message: Message.ERROR_DELETING_APPLICANT, error });
  }
};
