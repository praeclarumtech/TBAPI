import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
  removeManyApplicants,
  insertManyApplicants,
  updateManyApplicants,
  findApplicantByField,
  updateManyApplicantsService,
  createApplicantByResume,
  insertManyApplicantsToMain,
  deleteExportedApplicants,
  getExportsApplicantById,
  updateExportsApplicantById,
  removeManyExportsApplicants,
  hardDeleteExportsApplicantById,
} from '../services/applicantService.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { generateApplicantNo } from '../helpers/generateApplicationNo.js';
import Applicant from '../models/applicantModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { commonSearch } from '../helpers/commonFunction/search.js';
import { uploadCv, uploadResume } from '../helpers/multer.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import path from 'path';
import xlsx from 'xlsx';
import {
  generateApplicantCsv,
  processCsvRow,
} from '../helpers/commonFunction/applicantExport.js';
import User from '../models/userModel.js';
import { applicantEnum } from '../utils/enum.js';
import {
  extractTextFromPDF,
  extractTextFromDocx,
  parseResumeText,
  extractTextFromDoc,
} from '../helpers/importResume.js';
import ExportsApplicants from '../models/exportsApplicantsModel.js';

export const uploadResumeAndCreateApplicant = async (req, res) => {
  uploadResume(req, res, async (err) => {
    if (err) {
      logger.error(`${Message.FAILED_TO} upload resume: ${err.message}`);
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, err.message);
    }

    try {
      const { file } = req;
      if (!file) {
        logger.warn(`Resume file is ${Message.NOT_FOUND}`);
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          `Resume file is ${Message.NOT_FOUND}`
        );
      }

      let resumeText = '';
      const filePath = file.path;

      if (file.mimetype === 'application/pdf') {
        resumeText = await extractTextFromPDF(filePath);
      } else if (
        file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        resumeText = await extractTextFromDocx(filePath);
      } else if (file.mimetype === 'application/msword') {
        resumeText = await extractTextFromDoc(filePath);
      } else {
        throw new Error('Unsupported file type');
      }

      const parsedData = parseResumeText(resumeText);
      const { email, phone } = parsedData;

      const existingApplicant = await ExportsApplicants.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingApplicant) {
        logger.warn(
          `Applicant with email (${email}) or phone (${phone.phoneNumber}) already exists`
        );
        return HandleResponse(
          res,
          false,
          StatusCodes.CONFLICT,
          `Applicant with email (${email}) or phone (${phone.phoneNumber}) already exists`
        );
      }

      const applicantData = {
        ...parsedData,
        addedBy: applicantEnum.RESUME,
        resumeUrl: `/uploads/resumes/${file.filename}`,
      };

      const applicant = await createApplicantByResume(applicantData);

      logger.info(`Applicant ${Message.ADDED_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.CREATED,
        `Applicant ${Message.ADDED_SUCCESSFULLY}`,
        applicant
      );
    } catch (error) {
      logger.error(`${Message.FAILED_TO} add applicant: ${error}`);
      if (error.name === 'ValidationError') {
        const validationMessages = Object.values(error.errors).map(
          (err) => err.message.split('Path `')[1]?.split('`')[0] + ' is required'
        );
        logger.error(`Validation Error: ${validationMessages.join(', ')}`);
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          validationMessages.join(', ')
        );
      }
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${Message.FAILED_TO} add applicant:${error}`
      );
    } finally {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
    }
  });
};

export const addApplicant = async (req, res) => {
  try {
    const {
      name: { firstName, middleName, lastName },
      appliedRole,
      meta,
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
      addedBy: applicantEnum.MANUAL,
      appliedRole,
      meta: meta || {},
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
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = Object.values(error.keyValue)[0];
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${duplicateField} ${duplicateValue} is already in use please use a different number.`
      );
    } else {
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${Message.FAILED_TO} add aplicant.${error}`
      );
    }
  }
};

export const viewAllApplicant = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      applicationNo,
      applicantName,
      appliedSkills,
      searchSkills = '',
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
      state,
      workPreference,
      anyHandOnOffers,
      rating,
      communicationSkill,
      currentPkg,
      addedBy,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    let query = { isDeleted: false };

    if (addedBy && typeof addedBy === 'string') {
      const validAddedBy = addedBy
        .split(',')
        .map((val) => applicantEnum[val.trim().toUpperCase()])
        .filter(Boolean);

      query.addedBy =
        validAddedBy.length === 1
          ? validAddedBy[0]
          : validAddedBy.length > 1
            ? { $in: validAddedBy }
            : undefined;
    }

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills
        .split(',')
        .map(
          (skill) =>
            new RegExp(
              `^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            )
        );

      query.appliedSkills = { $all: skillsArray };
    }

    if (totalExperience) {
      const rangeMatch = totalExperience
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.totalExperience = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(totalExperience))) {
        query.totalExperience = parseFloat(totalExperience);
      }
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
      const rangeMatch = expectedPkg
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.expectedPkg = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(expectedPkg))) {
        query.expectedPkg = parseFloat(expectedPkg);
      }
    }

    if (currentPkg) {
      const rangeMatch = currentPkg
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.currentPkg = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(currentPkg))) {
        query.currentPkg = parseFloat(currentPkg);
      }
    }

    if (noticePeriod) {
      const rangeMatch = noticePeriod.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);

        query.noticePeriod = { $gte: min, $lte: max };
      } else {
        query.noticePeriod = parseInt(noticePeriod);
      }
    }

    if (gender && typeof gender === 'string') {
      query.gender = gender;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }

    if (
      currentCompanyDesignation &&
      typeof currentCompanyDesignation === 'string'
    ) {
      query.currentCompanyDesignation = currentCompanyDesignation;
    }

    if (state && typeof state === 'string') {
      query.state = { $regex: new RegExp(state, 'i') };
    }

    if (workPreference && typeof workPreference === 'string') {
      query.workPreference = workPreference;
    }

    if (anyHandOnOffers !== undefined) {
      query.anyHandOnOffers = anyHandOnOffers === 'true';
    }

    if (rating) {
      const rangeMatch = rating
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.rating = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(rating))) {
        query.rating = parseFloat(rating);
      }
    }

    if (communicationSkill) {
      const rangeMatch = communicationSkill
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.communicationSkill = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(communicationSkill))) {
        query.communicationSkill = parseFloat(communicationSkill);
      }
    }

    if (applicantName || searchSkills) {
      const searchFields = [
        'name.firstName',
        'name.middleName',
        'name.lastName',
        'appliedSkills',
      ];

      const searchQuery = applicantName || searchSkills;

      if (searchQuery) {
        const searchResults = await commonSearch(
          Applicant,
          searchFields,
          searchQuery,
          typeof searchSkills === 'string' ? searchSkills : '',
          pageNum,
          limitNum
        );

        if (searchResults.results.length > 0) {
          return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `Applicant are ${Message.FETCH_SUCCESSFULLY}`,
            searchResults
          );
        }
      }
    }

    const findApplicants = await pagination({
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
    logger.error(`${Message.FAILED_TO} view all applicant.${error}`);
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
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

export const getResumeAndCsvApplicants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      applicationNo,
      applicantName,
      appliedSkills,
      searchSkills = '',
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
      state,
      workPreference,
      anyHandOnOffers,
      rating,
      communicationSkill,
      currentPkg,
    } = req.query;

    const query = {
      isDeleted: false,
    };

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills
        .split(',')
        .map(
          (skill) =>
            new RegExp(
              `^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            )
        );

      query.appliedSkills = { $all: skillsArray };
    }

    if (totalExperience) {
      const rangeMatch = totalExperience
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.totalExperience = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(totalExperience))) {
        query.totalExperience = parseFloat(totalExperience);
      }
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
      const rangeMatch = expectedPkg
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.expectedPkg = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(expectedPkg))) {
        query.expectedPkg = parseFloat(expectedPkg);
      }
    }

    if (totalExperience) {
      const rangeMatch = totalExperience
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.totalExperience = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(totalExperience))) {
        query.totalExperience = parseFloat(totalExperience);
      }
    }

    if (currentPkg) {
      const rangeMatch = currentPkg
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.currentPkg = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(currentPkg))) {
        query.currentPkg = parseFloat(currentPkg);
      }
    }

    if (noticePeriod) {
      const rangeMatch = noticePeriod.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);

        query.noticePeriod = { $gte: min, $lte: max };
      } else {
        query.noticePeriod = parseInt(noticePeriod);
      }
    }

    if (gender && typeof gender === 'string') {
      query.gender = gender;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }
    if (
      currentCompanyDesignation &&
      typeof currentCompanyDesignation === 'string'
    ) {
      query.currentCompanyDesignation = currentCompanyDesignation;
    }

    if (state && typeof state === 'string') {
      query.state = { $regex: new RegExp(state, 'i') };
    }

    if (workPreference && typeof workPreference === 'string') {
      query.workPreference = workPreference;
    }

    if (anyHandOnOffers !== undefined) {
      query.anyHandOnOffers = anyHandOnOffers === 'true';
    }

    if (rating) {
      const rangeMatch = rating
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.rating = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(rating))) {
        query.rating = parseFloat(rating);
      }
    }

    if (communicationSkill) {
      const rangeMatch = communicationSkill
        .toString()
        .match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);

        query.communicationSkill = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(communicationSkill))) {
        query.communicationSkill = parseFloat(communicationSkill);
      }
    }

    if (applicantName || searchSkills) {
      const searchFields = [
        'name.firstName',
        'name.middleName',
        'name.lastName',
        'appliedSkills',
      ];

      const searchQuery = applicantName || searchSkills;

      if (searchQuery) {
        const searchResults = await commonSearch(
          ExportsApplicants,
          searchFields,
          searchQuery,
          typeof searchSkills === 'string' ? searchSkills : '',
          pageNum,
          limitNum
        );

        if (searchResults.results.length > 0) {
          return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `Applicant are ${Message.FETCH_SUCCESSFULLY}`,
            searchResults
          );
        }
      }
    }

    const applicants = await pagination({
      Schema: ExportsApplicants,
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
      applicants
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view all applicant.${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view all applicant.${error.message}`
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
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedApplicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Applicant.${error}`);
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

export const updateStatusImportApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const { interviewStage, status } = req.body;

    const updateStatus = await updateExportsApplicantById(applicantId, {
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
    const { filtered, source } = req.query;
    let query = { isDeleted: false };

    let applicants = [];

    if (filtered === 'both') {
      query = {
        addedBy: { $in: [applicantEnum.RESUME, applicantEnum.CSV] },
        isDeleted: false,
      };
      applicants = await ExportsApplicants.find(query);
      if (applicants.length) {
        await insertManyApplicantsToMain(applicants);
        await deleteExportedApplicants(query);
      }
    } else if (filtered === 'Resume' || filtered === 'Csv') {
      query = {
        addedBy:
          filtered === 'Resume' ? applicantEnum.RESUME : applicantEnum.CSV,
        isDeleted: false,
      };
      applicants = await ExportsApplicants.find(query);
      if (applicants.length) {
        await insertManyApplicantsToMain(applicants);
        await deleteExportedApplicants(query);
      }
    }

    if (source === 'Manual') {
      query = {
        addedBy: applicantEnum.MANUAL,
        isDeleted: false,
      };
      applicants = await Applicant.find(query);
    } else if (source === 'Resume' || source === 'Csv') {
      query = {
        addedBy: source === 'Resume' ? applicantEnum.RESUME : applicantEnum.CSV,
        isDeleted: false,
      };
      applicants = await Applicant.find(query);
    } else if (source === 'both') {
      query = {
        addedBy: { $in: [applicantEnum.RESUME, applicantEnum.CSV] },
        isDeleted: false,
      };
      applicants = await Applicant.find(query);
    } else if (!filtered) {
      query = { isDeleted: false };
      applicants = await Applicant.find(query);
    }

    if (!applicants.length) {
      logger.warn(`Applicants are ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicants are ${Message.NOT_FOUND}`
      );
    }

    const csvData = generateApplicantCsv(applicants);
    const filename = `${filtered || source || 'all'}_applicants.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvData);
    logger.info(Message.DONWLOADED);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} export file`);
    if (error.code === 11000) {
      const duplicateField =
        error.errmsg
          ?.match(/index: (.+?) dup key/)?.[1]
          ?.split('_')[0]
          ?.split('.')
          .pop() || 'unknown';
      const duplicateValue =
        error.errmsg?.match(/dup key: \{.*?: "(.*?)"/)?.[1] || 'unknown';
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${duplicateField} ${duplicateValue} is already in use, please use a different value.`
      );
    }
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} export file`
    );
  }
};

export const importApplicantCsv = async (req, res) => {
  try {
    const updateFlag =
      req.query.updateFlag === 'true' || req.body.updateFlag === true;

    const user = await User.findById(req.user.id);
    if (!user) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User is ${Message.NOT_FOUND}`
      );
    }

    uploadCv(req, res, async (err) => {
      if (err || !req.file) {
        const msg = err
          ? 'Invalid file type, please upload CSV,XLSX,XLS OR XLTX'
          : `${Message.FAILED_TO} upload file - No file provided`;
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, msg);
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let results = [];

      const processAndRespond = async () => {
        try {
          const processed = await Promise.all(results.map(processCsvRow));
          const validApplicants = processed
            .filter((p) => p.valid)
            .map((p) => p.data);

          if (!validApplicants.length) {
            return HandleResponse(
              res,
              false,
              StatusCodes.BAD_REQUEST,
              'No valid applicants found in the file'
            );
          }

          const emails = [
            ...new Set(
              validApplicants
                .map((a) => a.email?.trim().toLowerCase())
                .filter(Boolean)
            ),
          ];
          const existing = await ExportsApplicants.find({
            email: { $in: emails },
          }).lean();
          const existingEmails = new Set(
            existing.map((a) => a.email.trim().toLowerCase())
          );

          const toInsert = validApplicants.filter(
            (a) => !existingEmails.has(a.email.trim().toLowerCase())
          );
          const toUpdate = validApplicants.filter((a) =>
            existingEmails.has(a.email.trim().toLowerCase())
          );

          if (toInsert.length) {
            await insertManyApplicants(
              toInsert.map((a) => ({
                ...a,
                email: a.email.trim().toLowerCase(),
                createdBy: user.role,
                updatedBy: user.role,
                addedBy: applicantEnum.CSV,
              }))
            );
          }

          if (toUpdate.length && updateFlag) {
            await updateManyApplicants(
              toUpdate.map((a) => ({
                ...a,
                createdBy: user.role,
                updatedBy: user.role,
                addedBy: applicantEnum.CSV,
              }))
            );
          } else if (toUpdate.length) {
            return HandleResponse(
              res,
              false,
              StatusCodes.CONFLICT,
              'Duplicate records found',
              {
                existingEmails: toUpdate.map((r) => r.email),
              }
            );
          }

          fs.unlinkSync(req.file.path);

          return HandleResponse(
            res,
            true,
            StatusCodes.OK,
            `${fileExt === '.csv'
              ? 'CSV'
              : fileExt === '.xls'
                ? 'XLS'
                : fileExt === '.xlsx'
                  ? 'XLSx'
                  : fileExt === '.xltx'
                    ? 'XLTX'
                    : 'FILE'
            } imported successfully`,
            {
              insertedNewRecords: toInsert.map((r) => r.email),
              updatedRecords: updateFlag ? toUpdate.map((r) => r.email) : [],
            }
          );
        } catch (dbError) {
          logger.warn('dbError', dbError);
          if (dbError.code === 11000) {
            const duplicateField =
              dbError.errmsg
                ?.match(/index: (.+?) dup key/)?.[1]
                ?.split('_')[0]
                ?.split('.')
                .pop() || 'unknown';
            const duplicateValue =
              dbError.errmsg?.match(/dup key: \{.*?: "(.*?)"/)?.[1] ||
              'unknown';
            return HandleResponse(
              res,
              false,
              StatusCodes.INTERNAL_SERVER_ERROR,
              `${duplicateField} ${duplicateValue} is already in use, please use a different value.`
            );
          }
          return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            dbError.message
          );
        }
      };

      if (fileExt === '.csv') {
        let headers = [];
        fs.createReadStream(req.file.path)
          .pipe(csvParser({ headers: false, skipEmptyLines: true }))
          .on('data', (row) => {
            if (Object.values(row).every((val) => !val.trim())) return;

            if (!headers.length) {
              headers = Object.values(row).map((h) => h.trim());
            } else {
              const formatted = {};
              Object.values(row).forEach((val, i) => {
                formatted[headers[i]] = val?.trim() || '';
              });
              results.push(formatted);
            }
          })
          .on('end', processAndRespond)
          .on('error', (error) =>
            HandleResponse(
              res,
              false,
              StatusCodes.INTERNAL_SERVER_ERROR,
              'Error reading CSV file',
              error
            )
          );
      } else if (
        ['.xlsx', '.xlsm', '.xltx', '.xls', '.xlsb'].includes(fileExt)
      ) {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.SheetNames[0];
        const workSheet = workbook.Sheets[sheet];
        const exponentialFormatRegex = /^[+-]?\d+(\.\d+)?e[+-]?\d+$/i;
        Object.keys(workSheet).forEach((s) => {
          if (
            workSheet[s].w &&
            workSheet[s].t === 'n' &&
            exponentialFormatRegex.test(workSheet[s].w)
          ) {
            workSheet[s].w = String(workSheet[s].v);
          }
        });
        // results = xlsx.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '', raw: false }, { rawNumbers: true });
        // await processAndRespond();

        results = xlsx.utils.sheet_to_json(workSheet, {
          defval: '',
          raw: false,
        });
        await processAndRespond();
      } else {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Unsupported file type. Please upload CSV or XLSX only.'
        );
      }
    });
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} import file`
    );
  }
};

export const deleteManyApplicants = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(`ObjectId is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `ObjectId is ${Message.NOT_FOUND}`
      );
    }
    const removeApplicats = await removeManyApplicants(ids);
    if (removeApplicats.deletedCount === 0) {
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Applicant is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is ${Message.DELETED_SUCCESSFULLY}`,
      removeApplicats
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleteMany Applicants.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany Applicants.`
    );
  }
};

export const checkApplicantExists = async (req, res) => {
  try {
    const { whatsappNumber, phoneNumber, email } = req.query;

    if (!whatsappNumber && !phoneNumber && !email) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'At least one field (phoneNumber, whatsappNumber, or email) is required.'
      );
    }

    let existingApplicant = null;
    let duplicateField = '';

    if (whatsappNumber) {
      existingApplicant = await findApplicantByField(
        'phone.whatsappNumber',
        whatsappNumber
      );
      if (existingApplicant) duplicateField = 'whatsappNumber';
    }

    if (!existingApplicant && phoneNumber) {
      existingApplicant = await findApplicantByField(
        'phone.phoneNumber',
        phoneNumber
      );
      if (existingApplicant) duplicateField = 'phoneNumber';
    }

    if (!existingApplicant && email) {
      existingApplicant = await findApplicantByField('email', email);
      if (existingApplicant) duplicateField = 'email';
    }

    if (existingApplicant) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `This ${duplicateField} is already registered.`,
        { exists: true, duplicateField }
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'All fields are available.',
      { exists: false }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} check applicant.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} check applicant.${error}`
    );
  }
};

export const updateManyApplicant = async (req, res) => {
  try {
    const { applicantIds, updateData } = req.body;

    if (
      !applicantIds ||
      !Array.isArray(applicantIds) ||
      applicantIds.length === 0
    ) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Applicant IDs must be provided as a non-empty array.'
      );
    }

    const result = await updateManyApplicantsService(applicantIds, updateData);

    if (result.matchedCount === 0) {
      logger.warn(`${Message.NOT_FOUND} Applicants to update.`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `${Message.NOT_FOUND} Applicants to update.`
      );
    }

    logger.info(
      `${result.modifiedCount} Applicants ${Message.UPDATED_SUCCESSFULLY}`
    );
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `${result.modifiedCount} Applicants ${Message.UPDATED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} update multiple applicants: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update multiple applicants.`
    );
  }
};

export const viewImportedApplicantById = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const applicant = await getExportsApplicantById(applicantId);

    if (!applicant) {
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
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

export const updateImportedApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const { ...body } = req.body;

    let updateData = {
      ...body,
    };
    const updatedApplicant = await updateExportsApplicantById(
      applicantId,
      updateData
    );

    if (!updatedApplicant) {
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedApplicant
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update Applicant.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update applicant.`
    );
  }
};

export const deleteImportedApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const applicant = await updateExportsApplicantById(applicantId, {
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

export const hardDeleteImportedApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const result = await hardDeleteExportsApplicantById(applicantId);

    if (result.deletedCount === 0) {
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

export const deleteManyImportedApplicants = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(`ObjectId is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `ObjectId is ${Message.NOT_FOUND}`
      );
    }
    const removeApplicats = await removeManyExportsApplicants(ids);

    if (removeApplicats.deletedCount === 0) {
      logger.warn(`Applicant is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Applicant is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant is ${Message.DELETED_SUCCESSFULLY}`,
      removeApplicats
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleteMany Applicants.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany Applicants.`
    );
  }
};
