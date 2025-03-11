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
      currentCity,
      interviewStage,
      expectedPkg,
      noticePeriod,
      status,
      gender,
      currentCompanyDesignation,
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

    if (currentCity && typeof currentCity === 'string') {
      query.currentCity = { $regex: new RegExp(currentCity, 'i') };
    }

    if (interviewStage && typeof interviewStage === 'string') {
      query.interviewStage = interviewStage;
    }

    if (expectedPkg) {
      const rangeMatch = expectedPkg.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1], 10);
        const max = parseFloat(rangeMatch[2], 10);

        query.expectedPkg = { $gte: min, $lte: max };
      } else if (!isNaN(expectedPkg)) {
        query.expectedPkg = parseFloat(expectedPkg, 10);
      }
    }

    if (noticePeriod) {
      const rangeMatch = noticePeriod.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);

        query.noticePeriod = { $gte: min, $lte: max };
      } else if (!isNaN(noticePeriod)) {
        query.noticePeriod = parseInt(noticePeriod, 10);
      }
    }

    if (gender && typeof gender === 'string') {
      query.gender = gender;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }

    if (currentCompanyDesignation && typeof currentCompanyDesignation === 'string') {
      query.currentCompanyDesignation = currentCompanyDesignation;
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
    uploadCv(req, res, async (err) => {
      if (err) {
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, `${Message.FAILED_TO} upload CSV`);
      }
      if (!req.file) {
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, `${Message.FAILED_TO} upload CSV - No file provided`);
      }
      const results = [];
      let headers = [];
      fs.createReadStream(req.file.path)
        .pipe(csvParser({ headers: false, skipEmptyLines: true }))
        .on("data", (row) => {
          if (headers.length === 0) {
            headers = Object.values(row);
          } else {
            const formattedRow = {};
            Object.values(row).forEach((value, i) => {
              formattedRow[headers[i]] = value;
            });
            results.push(formattedRow);
          }
        })
        .on("end", async () => {
          try {
            const processedApplicants = await Promise.all(results.map(processCsvRow));

            const validApplicants = processedApplicants.filter(applicant => applicant !== null);

            if (validApplicants.length === 0) {
              return HandleResponse(res, false, StatusCodes.BAD_REQUEST, "No valid applicants found in CSV");
            }

            const savedApplicants = await createApplicants(validApplicants);

            fs.unlinkSync(req.file.path);
            return HandleResponse(res, true, StatusCodes.OK, "CSV Imported and Data Saved", savedApplicants);
          } catch (dbError) {
            return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, "Error saving applicants to the database");
          }
        })
        .on("error", (error) => {
          return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, "Error reading CSV file");
        });
    });
  } catch (error) {
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, `${Message.FAILED_TO} import CSV`);
  }
};

