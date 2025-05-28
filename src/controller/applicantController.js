import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
  removeManyApplicants,
  insertManyApplicants,
  UpdateManyApplicantsByImport,
  findApplicantByField,
  updateManyApplicantsService,
  createApplicantByResume,
  insertManyApplicantsToMain,
  deleteExportedApplicants,
  getExportsApplicantById,
  updateExportsApplicantById,
  removeManyExportsApplicants,
  hardDeleteExportsApplicantById,
  AddManyApplicantsByImport,
  inActivateApplicant,
  activateApplicant,
} from '../services/applicantService.js';
import duplicateRecord from '../models/duplicateRecordModel.js';
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
import { extractMatchingRoleFromResume } from '../services/applicantService.js';
import { extractSkillsFromResume } from '../services/applicantService.js';
import { buildApplicantQuery } from '../helpers/commonFunction/filterQuery.js';

export const uploadResumeAndCreateApplicant = async (req, res) => {
  uploadResume(req, res, async (err) => {
    if (err) {
      logger.error(`${Message.FAILED_TO} upload resume: ${err.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        err.message.includes('File type')
          ? Message.INVALID_FILE_TYPE
          : err.message
      );
    }

    if (!req.files || req.files.length === 0) {
      logger.warn('No files Uploaded');
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'No files Uploaded'
      );
    }

    const results = {
      totalFiles: req.files.length,
      processed: 0,
      inserted: [],
      skipped: [],
      errors: [],
    };

    try {
      await Promise.all(
        req.files.map(async (file) => {
          try {
            const allowedTypes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];

            if (!allowedTypes.includes(file.mimetype)) {
              throw new Error(Message.INVALID_FILE_TYPE);
            }

            const processResult = await processSingleResumeFile(file);

            if (processResult.status === 'inserted') {
              results.inserted.push(processResult.data);
            } else {
              results.skipped.push(processResult.data);
              await duplicateRecord.create({
                fileName: processResult.data.file,
                reason: processResult.data.reason,
                email: processResult.data.email,
              });
            }

            results.processed++;
          } catch (error) {
            let reason = 'Could not extract email or phone from resume';
            if (error.code === 11000) {
              reason = `Duplicate applicant`;
            }
            results.errors.push({
              file: file.originalname,
              error: error.message,
              stack:
                process.env.NODE_ENV === 'development'
                  ? error.stack
                  : undefined,
            });
            logger.error(
              `Error processing ${file.originalname}: ${error.message}`
            );
            await duplicateRecord.create({
              fileName: file.originalname,
              reason: reason,
            });
          } finally {
            // Cleanup
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (cleanupError) {
              logger.error(
                `File cleanup failed for ${file.path}: ${cleanupError.message}`
              );
            }
          }
        })
      );

      const allSkipped =
        results.inserted.length === 0 && results.skipped.length > 0;
      const hasErrors = results.errors.length > 0;

      let responseMessage = '';
      if (results.inserted.length > 0) {
        responseMessage = `${results.inserted.length} applicant${results.inserted.length > 1 ? 's' : ''
          } added successfully.`;
      }

      if (results.skipped.length > 0 || results.errors.length > 0) {
        const skippedAndErrorCount =
          results.skipped.length + results.errors.length;
        responseMessage += `${skippedAndErrorCount} applicant${skippedAndErrorCount > 1 ? 's' : ''
          } skipped due to duplicate record or resume not parsing `;

        const skippedFiles = results.skipped.map((item) => item.file);
        const errorFiles = results.errors.map((item) => item.file);
        const allProblemFiles = [...skippedFiles, ...errorFiles];

        if (allProblemFiles.length > 0) {
          responseMessage += `(${allProblemFiles.join(',\n ')}.)`;
        }
      }

      if (
        results.inserted.length === 0 &&
        results.skipped.length > 0 &&
        results.errors.length === 0
      ) {
        const errorMessages = results.skipped
          .map((err) => `${err.file}`)
          .join(',\n');
        responseMessage = `No applicants has been inserted due to duplicate record file : (${errorMessages})`;
      }

      if (
        results.inserted.length === 0 &&
        results.skipped.length === 0 &&
        results.errors.length > 0
      ) {
        const errorMessages = results.errors
          .map((err) => `${err.file}`)
          .join(',\n');
        responseMessage = `No applicants has been inserted due to could not extract email or phone from resume : ${errorMessages}`;
      }

      logger.info(`${responseMessage} ${JSON.stringify(results.errors)}`);
      return HandleResponse(
        res,
        results.inserted.length > 0,
        allSkipped
          ? StatusCodes.CONFLICT
          : hasErrors
            ? StatusCodes.CREATED
            : StatusCodes.CREATED,
        responseMessage,
        {
          summary: {
            totalFiles: results.totalFiles,
            successfullyProcessed: results.processed,
            insertedApplicants: results.inserted.length,
            skippedApplicants: results.skipped.length,
            erroredFiles: results.errors.length,
          },
          details: {
            inserted: results.inserted,
            skipped: results.skipped,
            errors: results.errors,
          },
        }
      );
    } catch (error) {
      logger.error(`Unexpected error in batch processing: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred during processing',
        process.env.NODE_ENV === 'development'
          ? { error: error.message }
          : undefined
      );
    }
  });
};

async function processSingleResumeFile(file) {
  let resumeText;
  const filePath = file.path;

  switch (file.mimetype) {
    case 'application/pdf':
      resumeText = await extractTextFromPDF(filePath);
      break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      resumeText = await extractTextFromDocx(filePath);
      break;
    case 'application/msword':
      resumeText = await extractTextFromDoc(filePath);
      break;
    default:
      throw new Error(Message.INVALID_FILE_TYPE);
  }

  const parsedData = parseResumeText(resumeText);
  if (!parsedData.email) {
    throw new Error('Could not extract email or phone from resume');
  }

  const matchedSkills = await extractSkillsFromResume(resumeText);

  const role = await extractMatchingRoleFromResume(resumeText);

  const existingRecords = await Promise.all([
    ExportsApplicants.findOne({
      $or: [
        { email: parsedData.email },
        { 'phone.phoneNumber': parsedData.phone?.phoneNumber },
      ],
    }),
    Applicant.findOne({
      $or: [
        { email: parsedData.email },
        { 'phone.phoneNumber': parsedData.phone?.phoneNumber },
      ],
    }),
  ]);

  const isDuplicate = existingRecords.some((record) => record !== null);
  if (isDuplicate) {
    return {
      status: 'skipped',
      data: {
        file: file.originalname,
        reason: 'Duplicate applicant',
        email: parsedData.email,
        phone: parsedData.phone?.phoneNumber,
      },
    };
  }

  const applicantData = {
    ...parsedData,
    otherSkills: matchedSkills,
    appliedRole: role,
    addedBy: applicantEnum.RESUME,
    isActive: true,
    resumeUrl: ``,
    originalFileName: file.originalname,
  };

  const applicant = await createApplicantByResume(applicantData);

  return {
    status: 'inserted',
    data: {
      file: file.originalname,
      applicantId: applicant._id,
      email: applicant.email,
      phone: applicant.phone?.phoneNumber,
    },
  };
}

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
      isActive: true,
      meta: meta || {},
      ...body,
    };
    const applicant = await createApplicant(applicantData);
    logger.info(`Applicant ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `Applicant ${Message.ADDED_SUCCESSFULLY}`,
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
      search,
      appliedSkillsOR,
      appliedRole,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;

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

    if (appliedSkillsOR) {
      const skillsArray = appliedSkillsOR
        .split(',')
        .map(
          (skill) =>
            new RegExp(
              `^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            )
        );

      query.appliedSkills = { $in: skillsArray };
    }

    if (appliedRole && typeof appliedRole === 'string') {
      const roleArray = appliedRole
        .split(',')
        .map((role) => new RegExp(`^${role.trim()}$`, 'i'));

      query.appliedRole = { $in: roleArray };
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

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
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

    if (search && typeof search === 'string') {
      const searchFields = [
        'name.firstName',
        'name.middleName',
        'name.lastName',
        'appliedSkills',
        'phone.phoneNumber',
        'phone.whatsappNumber',
        'email',
      ];

      const searchResults = await commonSearch(
        Applicant,
        searchFields,
        search,
        '',
        pageNum,
        limitNum
      );

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `Applicant are ${Message.FETCH_SUCCESSFULLY}`,
        searchResults
      );
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
    logger.info(`Applicant ${Message.FETCH_BY_ID}: ${applicantId}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.FETCH_BY_ID}`,
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
      search,
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

    if (search && typeof search === 'string') {
      const searchFields = [
        'name.firstName',
        'name.middleName',
        'name.lastName',
        'appliedSkills',
        'phone.phoneNumber',
        'phone.whatsappNumber',
        'email',
      ];

      const searchResults = await commonSearch(
        ExportsApplicants,
        searchFields,
        search,
        search,
        pageNum,
        limitNum
      );

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `Applicant are ${Message.FETCH_SUCCESSFULLY}`,
        searchResults
      );
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.UPDATED_SUCCESSFULLY}`,
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
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.DELETED_SUCCESSFULLY}`
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status ${Message.UPDATED_SUCCESSFULLY}`
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant status ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Applicant status ${Message.UPDATED_SUCCESSFULLY}`
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
    const { ids, fields, main, flag } = req.body;
    let applicants = [];
    const { viewAll = 'true' } = req.query;

    const defaultFields = [
      'name.firstName',
      'email',
      'phone.phoneNumber',
      'gender',
      'appliedRole',
      'currentCompanyDesignation',
      'resumeUrl',
    ];

    const selectedFields = fields?.length
      ? Array.from(new Set([...fields, ...defaultFields]))
      : null;

    const projection = selectedFields
      ? selectedFields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {
        _id: 1,
      })
      : undefined;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const query = { _id: { $in: ids }, isDeleted: false };

      if (filtered === 'Resume') query.addedBy = applicantEnum.RESUME;
      else if (filtered === 'Csv') query.addedBy = applicantEnum.CSV;
      else
        query.addedBy = {
          $in: [applicantEnum.RESUME, applicantEnum.CSV, applicantEnum.MANUAL],
        };

      applicants = main
        ? await Applicant.find(query, projection)
        : await ExportsApplicants.find(query, projection);

      if (!applicants.length) {
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          'No applicants found for provided ids.'
        );
      }

      if (!main && !fields?.length) {
        const emails = applicants.map((a) => a.email);
        const phones = applicants
          .map((a) => a.phone?.phoneNumber)
          .filter(Boolean);

        const existingApplicants = await Applicant.find({
          isDeleted: false,
          $or: [
            { email: { $in: emails } },
            { 'phone.phoneNumber': { $in: phones } },
          ],
        });

        if (existingApplicants.length > 0) {
          const existingEmailSet = new Set(existingApplicants.map((a) => a.email));
          const existingPhoneSet = new Set(
            existingApplicants.map((a) => a.phone?.phoneNumber)
          );

          // Separate non-duplicate and duplicate applicants
          const nonDuplicateApplicants = applicants.filter(
            (a) =>
              !existingEmailSet.has(a.email) &&
              !existingPhoneSet.has(a.phone?.phoneNumber)
          );

          const duplicateApplicants = applicants.filter(
            (a) =>
              existingEmailSet.has(a.email) ||
              existingPhoneSet.has(a.phone?.phoneNumber)
          );

          if (flag === true) {
            if (nonDuplicateApplicants.length > 0) {
              // Get IDs of non-duplicate applicants to move
              const nonDuplicateIds = nonDuplicateApplicants.map(a => a._id);

              // Move only non-duplicate records
              await insertManyApplicantsToMain(nonDuplicateApplicants);
              await deleteExportedApplicants({ _id: { $in: nonDuplicateIds } });

              if (duplicateApplicants.length > 0) {
                const conflictDetails = duplicateApplicants.map(
                  (a) => `Email: ${a.email}, Phone: ${a.phone?.phoneNumber}`
                );
                return HandleResponse(
                  res,
                  true,
                  StatusCodes.PARTIAL_CONTENT,
                  `${nonDuplicateApplicants.length} records were moved successfully in applicants and ${duplicateApplicants.length} records is already exist.`,
                  {
                    duplicantCount: duplicateApplicants?.length || 0,
                    successCount: nonDuplicateApplicants.length || 0
                  }
                );
              } else {
                return HandleResponse(
                  res,
                  true,
                  StatusCodes.GONE,
                  Message.MOVED_SUCCESSFULLY
                );
              }
            } else {
              const conflictDetails = duplicateApplicants.map(
                (a) => `Email: ${a.email}, Phone: ${a.phone?.phoneNumber}`
              );
              return HandleResponse(
                res,
                false,
                StatusCodes.CONFLICT,
                `${duplicateApplicants.length} records are duplicates: ` +
                conflictDetails.join('; ')
              );
            }
          }
        }

        // If no duplicates found or flag is false
        if (flag === true) {
          // No duplicates - move all records using their actual IDs
          const applicantIds = applicants.map(a => a._id);
          await insertManyApplicantsToMain(applicants);
          await deleteExportedApplicants({ _id: { $in: applicantIds } });
          return HandleResponse(
            res,
            true,
            StatusCodes.GONE,
            `${applicants.length} records moved successfully`
          );
        }
      }
      if (flag === false) {
        const csvData = generateApplicantCsv(applicants, selectedFields, ids);
        const filename = fields?.length
          ? 'selected_fields_applicants.csv'
          : 'selected_ids_applicants.csv';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${filename}`
        );
        return res.status(StatusCodes.OK).send(csvData);
      }

      return;
    }

    if (!main) {
      const query = { isDeleted: false, isActive: true };

      if (filtered === 'Resume') query.addedBy = applicantEnum.RESUME;
      else if (filtered === 'Csv') query.addedBy = applicantEnum.CSV;
      else query.addedBy = { $in: [applicantEnum.RESUME, applicantEnum.CSV] };

      applicants = await ExportsApplicants.find(query, projection);

      if (!applicants.length) {
        return HandleResponse(
          res,
          false,
          404,
          'No applicants found for the current filter.'
        );
      }

      if (!fields?.length) {
        const emails = applicants.map((a) => a.email);
        const phones = applicants
          .map((a) => a.phone?.phoneNumber)
          .filter(Boolean);

        const existingApplicants = await Applicant.find({
          isDeleted: false,
          $or: [
            { email: { $in: emails } },
            { 'phone.phoneNumber': { $in: phones } },
          ],
        });

        if (existingApplicants.length > 0) {
          const existingEmailSet = new Set(existingApplicants.map((a) => a.email));
          const existingPhoneSet = new Set(
            existingApplicants.map((a) => a.phone?.phoneNumber)
          );

          // Separate non-duplicate applicants
          const nonDuplicateApplicants = applicants.filter(
            (a) =>
              !existingEmailSet.has(a.email) &&
              !existingPhoneSet.has(a.phone?.phoneNumber)
          );

          // Get conflicting applicants for reporting
          const duplicateApplicants = applicants.filter(
            (a) =>
              existingEmailSet.has(a.email) ||
              existingPhoneSet.has(a.phone?.phoneNumber)
          );

          if (flag === true) {
            if (nonDuplicateApplicants.length > 0) {
              // Move only non-duplicate records
              await insertManyApplicantsToMain(nonDuplicateApplicants);
              await deleteExportedApplicants({
                _id: { $in: nonDuplicateApplicants.map(a => a._id) }
              });

              if (duplicateApplicants.length > 0) {
                // Partial success - some moved, some duplicates
                const conflictDetails = duplicateApplicants.map(
                  (a) => `Duplicate skipped: Email ${a.email}, Phone ${a.phone?.phoneNumber}`
                );
                return HandleResponse(
                  res,
                  true,
                  StatusCodes.PARTIAL_CONTENT,
                  `${nonDuplicateApplicants.length} records were moved successfully in applicants and ${duplicateApplicants.length} records is already exist.`,
                  {
                    duplicantCount: duplicateApplicants?.length || 0,
                    successCount: nonDuplicateApplicants.length || 0
                  }
                );
              } else {
                // All records moved successfully
                return HandleResponse(
                  res,
                  true,
                  StatusCodes.GONE,
                  Message.MOVED_SUCCESSFULLY
                );
              }
            } else {
              const conflictDetails = duplicateApplicants.map(
                (a) => `Duplicate: Email ${a.email}, Phone ${a.phone?.phoneNumber}`
              );

              return HandleResponse(
                res,
                false,
                StatusCodes.CONFLICT,
                Message.DUPLICATE_RECORDS,
                {
                  count: duplicateApplicants.length,
                  duplicates: conflictDetails
                }
              );
            }
          } else if (flag === false) {
            const csvData = generateApplicantCsv(applicants, selectedFields);
            const filename = `${filtered || 'all'}_applicants.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
              'Content-Disposition',
              `attachment; filename=${filename}`
            );
            return res.status(200).send(csvData);
          }
        } else {
          // No duplicates found
          if (flag === true) {
            // Move all records
            await insertManyApplicantsToMain(applicants);
            await deleteExportedApplicants({ _id: { $in: applicants.map(a => a._id) } });

            return HandleResponse(
              res,
              true,
              StatusCodes.GONE,
              Message.MOVED_SUCCESSFULLY
            );
          } else if (flag === false) {
            // Export all records
            const csvData = generateApplicantCsv(applicants, selectedFields);
            const filename = `${filtered || 'all'}_applicants.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
              'Content-Disposition',
              `attachment; filename=${filename}`
            );
            return res.status(200).send(csvData);
          }
        }
      }
      if (flag === false) {
        const csvData = generateApplicantCsv(applicants, selectedFields);
        const filename = fields?.length
          ? 'selected_fields_applicants.csv'
          : 'filtered_applicants.csv';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${filename}`
        );
        return res.status(200).send(csvData);
      }

      return;
    }
    if (viewAll === 'true') {
      const query = buildApplicantQuery(req.query);
      if (source) {
        query.addedBy =
          source === 'Resume'
            ? applicantEnum.RESUME
            : source === 'Csv'
              ? applicantEnum.CSV
              : source === 'Manual'
                ? applicantEnum.MANUAL
                : { $in: [applicantEnum.RESUME, applicantEnum.CSV] };
      }
      if (filtered) {
        query.addedBy =
          filtered === 'Resume'
            ? applicantEnum.RESUME
            : filtered === 'Csv'
              ? applicantEnum.CSV
              : { $in: [applicantEnum.RESUME, applicantEnum.CSV] };

        const tempApplicants = await ExportsApplicants.find(query, projection);

        if (!tempApplicants.length) {
          return HandleResponse(
            res,
            false,
            404,
            'No applicants found for given filter.'
          );
        }

        if (!fields?.length) {
          const tempEmails = tempApplicants.map((a) => a.email);
          const tempPhones = tempApplicants
            .map((a) => a.phone?.phoneNumber)
            .filter(Boolean);

          const existingApplicants = await Applicant.find({
            isDeleted: false,
            $or: [
              { email: { $in: tempEmails } },
              { 'phone.phoneNumber': { $in: tempPhones } },
            ],
          });

          const existingEmailSet = new Set(
            existingApplicants.map((a) => a.email)
          );
          const existingPhoneSet = new Set(
            existingApplicants.map((a) => a.phone?.phoneNumber)
          );

          const nonExistingApplicants = tempApplicants.filter(
            (a) =>
              !existingEmailSet.has(a.email) &&
              !existingPhoneSet.has(a.phone?.phoneNumber)
          );

          const existingConflicts = tempApplicants.filter(
            (a) =>
              existingEmailSet.has(a.email) ||
              existingPhoneSet.has(a.phone?.phoneNumber)
          );

          if (nonExistingApplicants.length > 0) {
            if (flag === true) {
              await insertManyApplicantsToMain(nonExistingApplicants);
              await deleteExportedApplicants({
                _id: { $in: nonExistingApplicants.map((a) => a._id) },
              });

              return HandleResponse(
                res,
                true,
                StatusCodes.GONE,
                'Records sucessfully to move applicants'
              );
            }
          }

          if (existingConflicts.length > 0) {
            const conflictDetails = existingConflicts.map(
              (a) =>
                `Duplicate records found with Email:-${a.email} and Phone:- ${a.phone?.phoneNumber}`
            );
            return HandleResponse(
              res,
              false,
              StatusCodes.CONFLICT,
              conflictDetails
            );
          }

          applicants = nonExistingApplicants;
        } else {
          applicants = tempApplicants;
        }

        if (flag === false) {
          const csvData = generateApplicantCsv(applicants, selectedFields);
          const filename = `${filtered}_filtered_applicants.csv`;

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
          );
          return res.status(200).send(csvData);
        }
      }

      const applicants = await Applicant.find(query);

      if (!applicants.length) {
        return HandleResponse(
          res,
          false,
          404,
          'No applicants found for export.'
        );
      }

      const csvData = generateApplicantCsv(applicants);
      const filename = `view_all_filtered_applicants_${new Date().toISOString()}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.status(200).send(csvData);
    }

    // If no filters provided, export all from main
    applicants = await Applicant.find({ isDeleted: false }, projection);

    if (!applicants.length) {
      return HandleResponse(res, false, 404, 'No applicants found.');
    }

    const csvData = generateApplicantCsv(applicants, selectedFields);
    const filename = 'all_applicants.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvData);
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
        error.errmsg?.match(/dup key: {.*?: "(.*?)"/)?.[1] || 'unknown';

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
      req.query.updateFlag === 'true'
        ? true
        : req.query.updateFlag === 'false'
          ? false
          : undefined;

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
          const validApplicants = [];
          const csvValidationErrors = [];

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            try {
              const processed = await processCsvRow(row, i, user.role);
              if (processed.valid) {
                validApplicants.push({
                  ...processed.data,
                  __lineNumber: processed.number,
                });
              }
            } catch (err) {
              const line = err?.lineNumber || i + 1;
              const messages = Array.isArray(err.message)
                ? err.message
                : [err.message];

              messages.forEach((msg) => {
                csvValidationErrors.push(`Line ${line}: ${msg}`);
              });
            }
          }

          if (csvValidationErrors.length > 0) {
            fs.unlinkSync(req.file.path);
            return HandleResponse(
              res,
              false,
              StatusCodes.BAD_REQUEST,
              csvValidationErrors
            );
          }

          if (!validApplicants.length) {
            fs.unlinkSync(req.file.path);
            return HandleResponse(
              res,
              false,
              StatusCodes.BAD_REQUEST,
              'No valid applicants found in the file'
            );
          }

          const normalize = (str) => str.trim().toLowerCase();
          const emailSet = new Set(
            validApplicants.map((a) => normalize(a.email)).filter(Boolean)
          );

          const existing = await ExportsApplicants.find({
            email: { $in: [...emailSet] },
          }).lean();
          const existingEmailsSet = new Set(
            existing.map((e) => normalize(e.email))
          );

          const phoneSet = new Set();
          const insertedNewRecords = [];
          const updatedRecords = [];
          const skippedRecords = [];
          const duplicatePhoneErrors = [];

          for (const item of validApplicants) {
            const {
              __lineNumber: line,
              email,
              phone: { phoneNumber, whatsappNumber } = {},
            } = item;

            if (phoneSet.has(phoneNumber) || phoneSet.has(whatsappNumber)) {
              duplicatePhoneErrors.push(
                `Duplicate phone:- ${phoneNumber} or WhatsApp:-${whatsappNumber} number in file at Line:${line}`
              );
              skippedRecords.push(email);
              continue;
            }

            phoneSet.add(phoneNumber);
            phoneSet.add(whatsappNumber);

            const emailLower = normalize(email);

            const mappedItem = {
              ...item,
              email: emailLower,
              createdBy: user.role,
              updatedBy: user.role,
              addedBy: applicantEnum.CSV,
              isActive: true,
            };

            const isPhoneDuplicate = await ExportsApplicants.findOne({
              email: { $ne: emailLower },
              $or: [
                { 'phone.phoneNumber': phoneNumber },
                { 'phone.whatsappNumber': whatsappNumber },
              ],
            }).lean();

            if (isPhoneDuplicate) {
              duplicatePhoneErrors.push(
                `Line ${line}: Phone or WhatsApp already exists in DB (Phone: ${phoneNumber}, WhatsApp: ${whatsappNumber})`
              );
              skippedRecords.push(email);
              continue;
            }

            const isExistingEmail = existingEmailsSet.has(emailLower);

            if (isExistingEmail && updateFlag) {
              try {
                await UpdateManyApplicantsByImport([mappedItem]);
                updatedRecords.push(email);
              } catch (updateErr) {
                logger.error(`Line ${line} update error:`, updateErr);
                duplicatePhoneErrors.push(
                  `Line ${line}: Failed to update record for ${emailLower}: ${updateErr.message}`
                );
                skippedRecords.push(email);
                continue;
              }
            } else if (!isExistingEmail) {
              await ExportsApplicants.create(mappedItem);
              insertedNewRecords.push(email);
            } else {
              skippedRecords.push(email);
            }
          }

          fs.unlinkSync(req.file.path);

          if (duplicatePhoneErrors.length > 0) {
            return HandleResponse(
              res,
              false,
              StatusCodes.BAD_REQUEST,
              duplicatePhoneErrors
            );
          }

          if (updateFlag === false) {
            const hasDuplicates = skippedRecords.length > 0;
            if (hasDuplicates) {
              return HandleResponse(
                res,
                false,
                StatusCodes.CONFLICT,
                'Duplicate records found. Do you want to update?',
                {
                  existingEmails: skippedRecords,
                }
              );
            }

            return HandleResponse(
              res,
              true,
              StatusCodes.OK,
              `${fileExt
                .replace(/[.,\/\s]/g, '')
                .toUpperCase()} imported successfully.`,
              {
                insertedNewRecords,
                updatedRecords,
              }
            );
          }

          if (updateFlag === true) {
            return HandleResponse(
              res,
              true,
              StatusCodes.OK,
              'Records updated successfully.',
              {
                insertedNewRecords,
                updatedRecords,
              }
            );
          }
        } catch (err) {
          logger.error('Error in processAndRespond:', err);
          fs.unlinkSync(req.file.path);
          return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            'An error occurred during processing.'
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
    logger.error('Import error:', error);
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Applicant ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.DELETED_SUCCESSFULLY}`,
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicant ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.UPDATED_SUCCESSFULLY}`,
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
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.DELETED_SUCCESSFULLY}`
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
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.DELETED_SUCCESSFULLY}`
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
      logger.warn(`Applicant ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Applicant ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.DELETED_SUCCESSFULLY}`,
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

export const activeApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const applicant = await activateApplicant(applicantId);

    if (!applicant) {
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.ACTIVE_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.ACTIVE_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} active applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} active applicant.`
    );
  }
};

export const inActiveApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;

    const applicant = await inActivateApplicant(applicantId);

    if (!applicant) {
      logger.warn(`User is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Applicant ${Message.INACTIVE_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant ${Message.INACTIVE_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} inactive applicant.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} inactive applicant.`
    );
  }
};
