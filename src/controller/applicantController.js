import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
  createApplicants,
} from '../services/applicantService.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { generateApplicantNo } from '../helpers/generateApplicationNo.js';
import Applicant from '../models/applicantModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { commonSearch } from '../helpers/commonFunction/search.js';
import { uploadCv } from '../helpers/multer.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import {
  generateApplicantCsv,
  processCsvRow,
} from '../helpers/commonFunction/applicantExport.js';

export const addApplicant = async (req, res) => {
  try {
    const {
      name: { firstName, middleName, lastName },
      ...body
    } = req.body;

    let id = null;
    if (req?.user) {
      const request = req?.user;
      id = request.id;
    }
    const applicationNo = await generateApplicantNo();
    const applicantData = {
      applicationNo,
      name: { firstName, middleName, lastName },
      user_id: id,
      ...body,
    };
    const applicant = await createApplicant(applicantData);
    logger.info(`Applicant is ${Message.ADDED_SUCCESSFULLY}: ${applicant._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Applicant is ${Message.ADDED_SUCCESSFULLY}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add aplicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add aplicant.`
    );
  }
};

export const viewAllApplicant = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      applicationNo,
      name,
      appliedSkills,
      totalExperience,
      startDate,
      endDate,
      city,
      interviewStage,
      expectedPkg,
      noticePeriod,
      status,
      gender,
      CurrentCompanyDesignation,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    let query = { isDeleted: false };

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills.split(',').map((skill) => skill.trim());
      query.appliedSkills = { $all: skillsArray };
    }

    if (totalExperience && !isNaN(totalExperience)) {
      query.totalExperience = parseFloat(totalExperience);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate)
        query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (city && typeof city === 'string') {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (interviewStage && typeof interviewStage === 'string') {
      query.interviewStage = interviewStage;
    }

    if (expectedPkg && typeof expectedPkg === 'string') {
      const rangeMatch = expectedPkg.match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = rangeMatch[1];
        const max = rangeMatch[2];

        query.expectedPkg = { $gte: min, $lte: max };
      } else {
        query.expectedPkg = expectedPkg;
      }
    }

    if (noticePeriod && typeof noticePeriod === 'string') {
      const rangeMatch = noticePeriod.match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = rangeMatch[1];
        const max = rangeMatch[2];

        query.noticePeriod = { $gte: min, $lte: max };
      } else {
        query.noticePeriod = noticePeriod;
      }
    }

    if (gender && typeof gender === 'string') {
      query.gender = gender;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }

    if (CurrentCompanyDesignation && typeof CurrentCompanyDesignation === 'string') {
      query.CurrentCompanyDesignation = CurrentCompanyDesignation;
    }

    let searchResults = { results: [], totalRecords: 0 };

    if (name) {
      const searchFields = [
        'name.firstName',
        'name.middleName',
        'name.lastName',
      ];

      searchResults = await commonSearch(
        Applicant,
        searchFields,
        name,
        pageNum,
        limitNum
      );
    }
    const findApplicants = searchResults.results.length
      ? searchResults
      : await pagination({
        Schema: Applicant,
        page: pageNum,
        limit: limitNum,
        query,
        sort: { createdAt: -1 },
      });

    logger.info(`Applicant are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant are ${Message.FETCH_SUCCESSFULLY}`,
      findApplicants
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view all applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view all applicant.`
    );
  }
};

export const viewApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await getApplicantById(applicantId);

    if (!applicant) {
      logger.warn(Message.APPLICANT_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.APPLICANT_NOT_FOUND
      );
    }
    logger.info(`Applicant is ${Message.FETCH_BY_ID}: ${applicantId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is  ${Message.FETCH_BY_ID}`,
      applicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view applicant by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view applicant by id.`
    );
  }
};

export const updateApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const { ...body } = req.body;

    let updateData = {
      ...body,
    };
    const updatedApplicant = await updateApplicantById(applicantId, updateData);

    if (!updatedApplicant) {
      logger.warn(`User is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`User is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `User is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedApplicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant.`
    );
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const applicant = await updateApplicantById(applicantId, {
      isDeleted: true,
    });

    if (!applicant) {
      logger.warn(`User is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is ${Message.DELETED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete applicant.`
    );
  }
};

export const updateStatus = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const { interviewStage, status } = req.body;

    const updateStatus = await updateApplicantById(applicantId, {
      interviewStage,
      status,
    });

    if (!updateStatus) {
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant status is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status is ${Message.UPDATED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant.`
    );
  }
};

export const exportApplicantCsv = async (req, res) => {
  try {
    const applicants = await getAllapplicant();

    if (!applicants.length) {
      logger.warn('Applicants not found');
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Applicants not found'
      );
    }

    const csvData = generateApplicantCsv(applicants);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applicants.csv');

    res.status(200).send(csvData);
    logger.info(Message.DONWLOADED);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to export CSV file.'
    );
  }
};
export const importApplicantCsv = async (req, res) => {
  try {
    uploadCv(req, res, async () => {
      if (!req.file) {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          `${Message.FAILED_TO} upload csv`
        );
      }

      const results = [];
      const promises = [];

      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', async (data) => {
          promises.push(
            processCsvRow(data).then((applicant) => results.push(applicant))
          );
        })
        .on('end', async () => {
          await Promise.all(promises);
          await createApplicants(results);
          fs.unlinkSync(req.file.path);
          return HandleResponse(res, true, StatusCodes.OK, Message.IMPORTED);
        });
    });

    logger.info(Message.IMPORTED);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} import csv,`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} import csv,`
    );
  }
};
