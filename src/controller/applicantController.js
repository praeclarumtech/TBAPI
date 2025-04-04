import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
  removeManyApplicants,
  insertManyApplicants,
  updateManyApplicants,
  findApplicantByField,
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

      const existingApplicant = await Applicant.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingApplicant) {
        logger.warn(`Applicant with email (${email}) or phone (${phone.phoneNumber}) already exists`);
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          `Applicant with email (${email}) or phone (${phone.phoneNumber}) already exists`
        );
      }
      const applicationNo = await generateApplicantNo();

      const applicantData = {
        ...parsedData,
        applicationNo,
        addedBy: applicantEnum.RESUME,
        resumeUrl: `/uploads/resumes/${file.filename}`,
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
      logger.error(`${Message.FAILED_TO} add applicant: ${error}`);
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
    logger.error(`${Message.FAILED_TO} add aplicant.${error}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add aplicant.${error}`
    );
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
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    let query = { isDeleted: false };

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills.split(',').map((skill) => skill.trim());
      query.appliedSkills = {
        $all: skillsArray.map((skill) => ({
          $elemMatch: { $regex: new RegExp(`^${skill}$`, 'i') }
        }))
      };
    }

    if (totalExperience) {
      const rangeMatch = totalExperience.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
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
      const rangeMatch = expectedPkg.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);
    
        query.expectedPkg = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(expectedPkg))) {
        query.expectedPkg = parseFloat(expectedPkg);
      }
    }

    if (currentPkg) {
      const rangeMatch = currentPkg.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
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
      const rangeMatch = rating.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);
    
        query.rating = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(rating))) {
        query.rating = parseFloat(rating);
      }
    }

    if (communicationSkill) {
      const rangeMatch = communicationSkill.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
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
      addedBy: { $in: [applicantEnum.CSV, applicantEnum.RESUME] },
    };

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills.split(',').map((skill) => skill.trim());
      query.appliedSkills = { $all: skillsArray };
    }

    if (totalExperience) {
      const rangeMatch = totalExperience.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
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
      const rangeMatch = expectedPkg.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);
    
        query.expectedPkg = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(expectedPkg))) {
        query.expectedPkg = parseFloat(expectedPkg);
      }
    }

    if (totalExperience) {
      const rangeMatch = totalExperience.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);
    
        query.totalExperience = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(totalExperience))) {
        query.totalExperience = parseFloat(totalExperience);
      }
    }

    if (currentPkg) {
      const rangeMatch = currentPkg.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
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
      const rangeMatch = rating.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[3]);
    
        query.rating = { $gte: min, $lte: max };
      } else if (!isNaN(parseFloat(rating))) {
        query.rating = parseFloat(rating);
      }
    }

    if (communicationSkill) {
      const rangeMatch = communicationSkill.toString().match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    
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

    const applicants = await pagination({
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

export const exportApplicantCsv = async (req, res) => {
  try {
    const { filtered } = req.query;
    let query = {};
    if (filtered) {
      if (Object.values(applicantEnum).includes(filtered)) {
        query = { addedBy: filtered };
      } else {
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, `invalid filter value`)
      }
    }
    const applicants = await getAllapplicant(query);
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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filtered ? `${filtered}_applicants` : 'all_applicants'}.csv`
    );
    res.status(200).send(csvData);
    logger.info(Message.DONWLOADED);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} export file`);
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
      req.query.updateFlag === 'true' || req.body.updateFlag === true || false;
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
      if (err) {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          `${Message.FAILED_TO} upload CSV`
        );
      }
      if (!req.file) {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          `${Message.FAILED_TO} upload CSV - No file provided`
        );
      }

      const results = [];
      let headers = [];
      let newHeaders = [];

      fs.createReadStream(req.file.path)
        .pipe(csvParser({ headers: false, skipEmptyLines: true }))
        .on('data', (row) => {
          if (Object.values(row).every((value) => !value.trim())) {
            return;
          }
          if (headers.length === 0) {
            headers = Object.values(row);
            newHeaders = headers.map((item) => item.trim());
          } else {
            const formattedRow = {};
            Object.values(row).forEach((value, i) => {
              formattedRow[newHeaders[i]] = value ? value.trim() : '';
            });

            results.push(formattedRow);
          }
        })
        .on('end', async () => {
          try {
            const processedApplicants = await Promise.all(
              results.map(processCsvRow)
            );
            const validApplicants = processedApplicants
              .filter((applicant) => applicant.valid)
              .map((applicant) => applicant.data);

            if (validApplicants.length === 0) {
              return HandleResponse(
                res,
                false,
                StatusCodes.BAD_REQUEST,
                'No valid applicants found in CSV'
              );
            }

            const emails = validApplicants
              .map((applicant) => applicant.email?.trim().toLowerCase())
              .filter((email) => email);

            const uniqueEmails = [...new Set(emails)];

            const existingApplicants = await Applicant.find({
              email: { $in: uniqueEmails },
            }).lean();
            const existingEmails = new Set(
              existingApplicants.map((app) => app.email.trim().toLowerCase())
            );

            const toInsert = validApplicants.filter(
              (applicant) =>
                applicant.email &&
                !existingEmails.has(applicant.email.trim().toLowerCase())
            );

            const toUpdate = validApplicants.filter(
              (applicant) =>
                applicant.email &&
                existingEmails.has(applicant.email.trim().toLowerCase())
            );

            // Insert new applicants
            if (toInsert.length > 0) {
              await insertManyApplicants(
                toInsert.map((applicant) => ({
                  ...applicant,
                  email: applicant.email.trim().toLowerCase(),
                  createdBy: user.role,
                  updatedBy: user.role,
                  addedBy: applicantEnum.CSV,
                }))
              );
            }
            // Update existing applicants
            if (toUpdate.length > 0) {
              if (updateFlag) {
                await updateManyApplicants(
                  toUpdate.map((applicant) => ({
                    ...applicant,
                    createdBy: user.role,
                    updatedBy: user.role,
                    addedBy: applicantEnum.CSV,
                  }))
                );
              } else {
                return HandleResponse(
                  res,
                  false,
                  StatusCodes.CONFLICT,
                  'Duplicate records found',
                  { existingEmails: toUpdate.map((record) => record.email) }
                );
              }
            }
            fs.unlinkSync(req.file.path);

            return HandleResponse(
              res,
              true,
              StatusCodes.OK,
              'CSV imported successfully',
              {
                insertedNewRecords: toInsert.map((record) => record.email),
                updatedRecords: updateFlag
                  ? toUpdate.map((record) => record.email)
                  : [],
              }
            );
          } catch (dbError) {
            return HandleResponse(
              res,
              false,
              StatusCodes.INTERNAL_SERVER_ERROR,
              dbError.message
            );
          }
        })
        .on('error', (error) => {
          return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Error reading CSV file',
            error
          );
        });
    });
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} import CSV`
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
        Message.OBJ_ID_NOT_FOUND
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
        "At least one field (phoneNumber, whatsappNumber, or email) is required."
      );
    }

    let existingApplicant = null;
    let duplicateField = "";

    if (whatsappNumber) {
      existingApplicant = await findApplicantByField("phone.whatsappNumber", whatsappNumber );
      if (existingApplicant) duplicateField = "whatsappNumber";
    }

    if (!existingApplicant && phoneNumber) {
      existingApplicant = await findApplicantByField( "phone.phoneNumber", phoneNumber );
      if (existingApplicant) duplicateField = "phoneNumber";
    }

    if (!existingApplicant && email) {
      existingApplicant = await findApplicantByField("email", email);
      if (existingApplicant) duplicateField = "email";
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
      "All fields are available.",
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

