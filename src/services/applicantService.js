import Applicant from '../models/applicantModel.js';
import ExportsApplicants from '../models/exportsApplicantsModel.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { applicantEnum } from '../utils/enum.js'
import { generateApplicantCsv, processCsvRow } from '../helpers/commonFunction/applicantExport.js';
import { Message } from '../utils/constant/message.js';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import csvParser from 'csv-parser';
// import { processCsvRow } from './processCsvRow';

import User from '../models/userModel.js'

export const createApplicant = async (body) => {
  const applicant = new Applicant({ ...body });
  await applicant.save();
  return applicant;
};

export const createApplicantByResume = async (body) => {
  try {
    const applicant = new ExportsApplicants({ ...body });
    await applicant.save();
    return applicant;
  } catch (error) {
    logger.error('error while add applicant by resume', error);
    throw error;
  }
};

export const insertManyApplicants = async (applicantsArray) => {
  try {
    return await ExportsApplicants.bulkWrite(
      applicantsArray.map((applicant) => ({
        insertOne: { document: applicant },
      }))
    );
  } catch (error) {
    logger.error('error while insertMany applicants', error);
    throw error;
  }
};

export const UpdateManyApplicantsByImport = async (applicantsArray) => {
  try {
    return await ExportsApplicants.bulkWrite(
      applicantsArray.map((applicant) => ({
        updateOne: {
          filter: { email: applicant.email.trim().toLowerCase() },
          update: { $set: applicant },
          upsert: true,
        },
      }))
    );
  } catch (error) {
    logger.error('error while updating applicants', error);
    throw error;
  }
};

export const deleteExportedApplicants = async (query) => {
  try {
    return await ExportsApplicants.deleteMany(query);
  } catch (error) {
    logger.error('error while deleting exported applicants', error);
    throw error;
  }
};

export const insertManyApplicantsToMain = async (applicantsArray) => {
  try {
    return await Applicant.insertMany(applicantsArray);
  } catch (error) {
    logger.error('error while inserting applicants to main', error);
    throw error;
  }
};

export const getAllapplicant = async (query) => {
  try {
    return await ExportsApplicants.find(query);
  } catch (error) {
    logger.error('error while fetching all applicants', error);
    throw error;
  }
};

export const getApplicantById = async (id) => {
  return Applicant.findById(id);
};

export const updateApplicantById = async (id, updateData) => {
  return Applicant.updateOne({ _id: id }, updateData);
};

export const removeManyApplicants = async (ids) => {
  return await Applicant.deleteMany({ _id: { $in: ids } });
};

export const findApplicantByField = async (field, value) => {
  return await Applicant.findOne({ [field]: value });
};

export const updateManyApplicantsService = async (applicantIds, updateData) => {
  try {
    const result = await ExportsApplicants.updateMany(
      { _id: { $in: applicantIds } },
      { $set: updateData }
    );
    return result;
  } catch (error) {
    throw new Error('Failed to update multiple applicants: ' + error.message);
  }
};

export const getExportsApplicantById = async (id) => {
  return ExportsApplicants.findById(id);
};

export const updateExportsApplicantById = async (id, updateData) => {
  return ExportsApplicants.updateOne({ _id: id }, updateData);
};

export const hardDeleteExportsApplicantById = async (id) => {
  return ExportsApplicants.deleteOne({ _id: id });
};

export const removeManyExportsApplicants = async (ids) => {
  return await ExportsApplicants.deleteMany({ _id: { $in: ids } });
};


export const AddManyApplicantsByImport = async (body) => {
  try {
    const applicant = new ExportsApplicants({ ...body });
    return await applicant.save();

  } catch (error) {
    throw new Error('Failed to update multiple applicants: ' + error);
  }
};
export const handlefiltersForExportApplicants = async (filtered, source, appliedSkills, ids, fields, main) => {
  try {
    let applicants = [];
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
      ? selectedFields.reduce((acc, field) => ({ ...acc, [field]: 1 }), { _id: 1 })
      : undefined;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const query = { _id: { $in: ids }, isDeleted: false };

      if (filtered === 'Resume') query.addedBy = applicantEnum.RESUME;
      else if (filtered === 'Csv') query.addedBy = applicantEnum.CSV;
      else query.addedBy = { $in: [applicantEnum.RESUME, applicantEnum.CSV] };

      applicants = main
        ? await Applicant.find(query, projection)
        : await ExportsApplicants.find(query, projection);

      if (!applicants.length) {
        return { status: 404, message: 'No applicants found for provided ids.' };
      }

      if (!main && !fields?.length) {
        const emails = applicants.map(a => a.email);
        const phones = applicants.map(a => a.phone?.phoneNumber).filter(Boolean);

        const existingApplicants = await Applicant.find({
          isDeleted: false,
          $or: [
            { email: { $in: emails } },
            { 'phone.phoneNumber': { $in: phones } },
          ],
        });

        if (existingApplicants.length > 0) {
          const existingEmailSet = new Set(existingApplicants.map(a => a.email));
          const existingPhoneSet = new Set(existingApplicants.map(a => a.phone?.phoneNumber));

          const conflictDetails = applicants
            .filter(a =>
              existingEmailSet.has(a.email) ||
              existingPhoneSet.has(a.phone?.phoneNumber)
            )
            .map(a => `Duplicate records found with Email:-${a.email} and Phone:- ${a.phone?.phoneNumber}`);

          return { status: 409, message: 'Conflict found', conflictDetails };
        }
      }

      const csvData = generateApplicantCsv(applicants, selectedFields, ids);

      if (!fields?.length && !main) {
        await insertManyApplicantsToMain(applicants);
        await deleteExportedApplicants({ _id: { $in: ids } });
      }

      return { status: 200, csvData };
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills
        .split(',')
        .map(skill => new RegExp(`^${skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));

      const query = {
        isDeleted: false,
        appliedSkills: { $all: skillsArray },
      };

      const applicants = await Applicant.find(query);

      if (!applicants.length) {
        return { status: 404, message: 'No applicants found with given skills.' };
      }

      const csvData = generateApplicantCsv(applicants);
      return { status: 200, csvData };
    }

    let query = { isDeleted: false };

    if (filtered) {
      query.addedBy =
        filtered === 'Resume' ? applicantEnum.RESUME
          : filtered === 'Csv' ? applicantEnum.CSV
            : { $in: [applicantEnum.RESUME, applicantEnum.CSV] };

      const tempApplicants = await ExportsApplicants.find(query, projection);

      if (!tempApplicants.length) {
        return { status: 404, message: 'No applicants found for given filter.' };
      }

      if (!fields?.length) {
        const tempEmails = tempApplicants.map(a => a.email);
        const tempPhones = tempApplicants.map(a => a.phone?.phoneNumber).filter(Boolean);

        const existingApplicants = await Applicant.find({
          isDeleted: false,
          $or: [
            { email: { $in: tempEmails } },
            { 'phone.phoneNumber': { $in: tempPhones } },
          ],
        });

        const existingEmailSet = new Set(existingApplicants.map(a => a.email));
        const existingPhoneSet = new Set(existingApplicants.map(a => a.phone?.phoneNumber));

        const nonExistingApplicants = tempApplicants.filter(
          a => !existingEmailSet.has(a.email) && !existingPhoneSet.has(a.phone?.phoneNumber)
        );

        const existingConflicts = tempApplicants.filter(
          a => existingEmailSet.has(a.email) || existingPhoneSet.has(a.phone?.phoneNumber)
        );

        if (nonExistingApplicants.length > 0) {
          await insertManyApplicantsToMain(nonExistingApplicants);
          await deleteExportedApplicants({ _id: { $in: nonExistingApplicants.map(a => a._id) } });
        }

        if (existingConflicts.length > 0) {
          const conflictDetails = existingConflicts.map(
            a => `Duplicate records found with Email:-${a.email} and Phone:- ${a.phone?.phoneNumber}`
          );
          return { status: 409, message: 'Conflict found', conflictDetails };
        }

        applicants = nonExistingApplicants;
      } else {
        applicants = tempApplicants;
      }

      const csvData = generateApplicantCsv(applicants, selectedFields);
      return { status: 200, csvData };
    }

    if (source) {
      query.addedBy =
        source === 'Resume' ? applicantEnum.RESUME
          : source === 'Csv' ? applicantEnum.CSV
            : source === 'Manual' ? applicantEnum.MANUAL
              : { $in: [applicantEnum.RESUME, applicantEnum.CSV] };

      applicants = await Applicant.find(query, projection);

      if (!applicants.length) {
        return { status: 404, message: 'No applicants found for given filter.' };
      }

      const csvData = generateApplicantCsv(applicants, selectedFields);
      return { status: 200, csvData };
    }

    applicants = await Applicant.find({ isDeleted: false }, projection);

    if (!applicants.length) {
      return { status: 404, message: 'No applicants found.' };
    }

    const csvData = generateApplicantCsv(applicants, selectedFields);
    return { status: 200, csvData };
  } catch (error) {
    return { status: 500, message: 'Failed to export file', error };
  }
};



export const handleImportFunction = async (reqFile, userId, userRole, updateFlag) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, message: 'User not found' };
    }

    const fileExt = path.extname(reqFile.originalname).toLowerCase();
    let results = [];

    const processAndRespond = async () => {
      try {
        const validApplicants = [];
        const csvValidationErrors = [];

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            const processed = await processCsvRow(row, i, userRole);
            if (processed.valid) {
              validApplicants.push({
                ...processed.data,
                __lineNumber: processed.number,
              });
            }
          } catch (err) {
            const line = err?.lineNumber || i + 1;
            const messages = Array.isArray(err.message) ? err.message : [err.message];
            messages.forEach((msg) => csvValidationErrors.push(`Line ${line}: ${msg}`));
          }
        }

        if (csvValidationErrors.length > 0) {
          fs.unlinkSync(reqFile.path);
          return { status: 400, message: 'Validation errors', data: csvValidationErrors };
        }

        if (!validApplicants.length) {
          fs.unlinkSync(reqFile.path);
          return { status: 400, message: 'No valid applicants found in the file' };
        }

        const normalize = (str) => str.trim().toLowerCase();
        const emailSet = new Set(validApplicants.map((a) => normalize(a.email)).filter(Boolean));

        const existing = await ExportsApplicants.find({ email: { $in: [...emailSet] } }).lean();
        const existingEmailsSet = new Set(existing.map((e) => normalize(e.email)));

        const phoneSet = new Set();
        const insertedNewRecords = [];
        const updatedRecords = [];
        const skippedRecords = [];
        const duplicatePhoneErrors = [];

        for (const item of validApplicants) {
          const { __lineNumber: line, email, phone: { phoneNumber, whatsappNumber } = {} } = item;

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
            createdBy: userRole,
            updatedBy: userRole,
            addedBy: applicantEnum.CSV,
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
              duplicatePhoneErrors.push(
                `Line ${line}: Failed to update record for ${emailLower}: ${updateErr.message}`
              );
              skippedRecords.push(email);
            }
          } else if (!isExistingEmail) {
            await ExportsApplicants.create(mappedItem);
            insertedNewRecords.push(email);
          } else {
            skippedRecords.push(email);
          }
        }

        fs.unlinkSync(reqFile.path);

        if (duplicatePhoneErrors.length > 0) {
          return { status: 400, message: 'Found duplicate phone/whatsapp', data: duplicatePhoneErrors };
        }

        if (updateFlag === false && skippedRecords.length > 0) {
          return {
            status: 409,
            message: 'Duplicate records found. Do you want to update?',
            data: { existingEmails: skippedRecords },
          };
        }

        const responseMessage =
          updateFlag === true ? 'Records updated successfully.' : 'File imported successfully.';

        return {
          status: 200,
          message: responseMessage,
          data: { insertedNewRecords, updatedRecords },
        };
      } catch (err) {
        fs.unlinkSync(reqFile.path);
        return { status: 500, message: 'An error occurred during processing.' };
      }
    };

    if (fileExt === '.csv') {
      return new Promise((resolve, reject) => {
        let headers = [];
        fs.createReadStream(reqFile.path)
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
          .on('end', async () => resolve(await processAndRespond()))
          .on('error', (error) =>
            resolve({ status: 500, message: 'Error reading CSV file', data: error.message })
          );
      });
    } else if (['.xlsx', '.xlsm', '.xltx', '.xls', '.xlsb'].includes(fileExt)) {
      const workbook = xlsx.readFile(reqFile.path);
      const sheet = workbook.SheetNames[0];
      const workSheet = workbook.Sheets[sheet];

      const exponentialFormatRegex = /^[+-]?\d+(\.\d+)?e[+-]?\d+$/i;
      Object.keys(workSheet).forEach((s) => {
        if (workSheet[s].w && workSheet[s].t === 'n' && exponentialFormatRegex.test(workSheet[s].w)) {
          workSheet[s].w = String(workSheet[s].v);
        }
      });

      results = xlsx.utils.sheet_to_json(workSheet, { defval: '', raw: false });
      return await processAndRespond();
    } else {
      return { status: 400, message: 'Unsupported file type. Please upload CSV or XLSX only.' };
    }
  } catch (err) {
    return { status: 500, message: 'Import error', data: err.message };
  }
};





