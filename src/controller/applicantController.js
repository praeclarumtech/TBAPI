import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
  removeManyApplicants
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
import User from '../models/userModel.js';

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
      currentPkg
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

    if (totalExperience) {
      const rangeMatch = totalExperience.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);

        query.totalExperience = { $gte: min, $lte: max };
      } else {
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
      const rangeMatch = expectedPkg.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);

        query.expectedPkg = { $gte: min, $lte: max };
      } else {
        query.expectedPkg = parseFloat(expectedPkg);
      }
    }

    if (currentPkg) {
      const rangeMatch = currentPkg.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);

        query.currentPkg = { $gte: min, $lte: max };
      } else {
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

    if (currentCompanyDesignation && typeof currentCompanyDesignation === 'string') {
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
      const rangeMatch = rating.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);

        query.rating = { $gte: min, $lte: max };
      } else {
        query.rating = parseFloat(rating);
      }
    }

    if (communicationSkill) {
      const rangeMatch = communicationSkill.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);

        query.communicationSkill = { $gte: min, $lte: max };
      } else {
        query.communicationSkill = parseFloat(communicationSkill);
      }
    }


    if (applicantName || searchSkills) {
      const searchFields = [
        'name.firstName',
        'name.middleName',
        'name.lastName',
        'appliedSkills'
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
      logger.warn(`Applicants is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicants is ${Message.NOT_FOUND}`
      );
    }

    const csvData = generateApplicantCsv(applicants);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applicants.csv');

    res.status(200).send(csvData);
    logger.info(Message.DONWLOADED);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} export file`)
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
    const updateFlag = req.query.updateFlag === 'true' || req.body.updateFlag === true || false;

    const user = await User.findById(req.user.id);
    if (!user) {
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, `User is ${Message.NOT_FOUND}`);
    }

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
        .on('data', (row) => {
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
        .on('end', async () => {
          try {
            const processedApplicants = await Promise.all(results.map(processCsvRow));
            const validApplicants = processedApplicants.filter(applicant => applicant !== null);

            if (validApplicants.length === 0) {
              return HandleResponse(res, false, StatusCodes.BAD_REQUEST, 'No valid applicants found in CSV');
            }

            const emails = validApplicants.map(applicant => applicant.email.trim().toLowerCase());
            const uniqueEmails = [...new Set(emails)];

            const existingApplicants = await Applicant.find({
              email: { $in: uniqueEmails }
            }).lean();

            const existingEmails = new Set(existingApplicants.map(app => app.email.trim().toLowerCase()));

            const toInsert = validApplicants.filter(
              applicant => !existingEmails.has(applicant.email.trim().toLowerCase())
            );

            const toUpdate = validApplicants.filter(
              applicant => existingEmails.has(applicant.email.trim().toLowerCase())
            );

            // Insert new records
            if (toInsert.length > 0) {
              const insertOperations = toInsert.map(applicant => ({
                insertOne: {
                  document: {
                    ...applicant,
                    email: applicant.email.trim().toLowerCase(),
                    createdBy: user.role,
                    updatedBy: user.role,
                    addByManual: false,
                  }
                }
              }));

              await Applicant.bulkWrite(insertOperations);
            }

            // Update existing records (only if updateFlag = true)
            if (toUpdate.length > 0) {
              if (updateFlag) {
                const updateOperations = toUpdate.map(applicant => ({
                  updateOne: {
                    filter: { email: applicant.email.trim().toLowerCase() },
                    update: {
                      $set: {
                        ...applicant,
                        createdBy: user.role,
                        updatedBy: user.role,
                        addByManual: false,
                      }
                    },
                    upsert: true
                  }
                }));
                await Applicant.bulkWrite(updateOperations);
              } else {
                return HandleResponse(
                  res,
                  false,
                  StatusCodes.CONFLICT,
                  'Duplicate records found',
                  { existingEmails: toUpdate.map(record => record.email) }
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
                insertedNewRecords: toInsert.map(record => record.email),
                updatedRecords: updateFlag ? toUpdate.map(record => record.email) : [],
              }
            );
          } catch (dbError) {
            console.error('Error while saving to DB:', dbError.stack);
            return HandleResponse(
              res,
              false,
              StatusCodes.INTERNAL_SERVER_ERROR,
              dbError.message
            );
          }
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          return HandleResponse(
            res,
            false,
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Error reading CSV file'
          );
        });
    });
  } catch (error) {
    console.error('Last catch block error:', error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} import CSV`
    );
  }
}

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














