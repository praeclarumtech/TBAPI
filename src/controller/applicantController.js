import {
  createApplicant,
  getAllapplicant,
  getApplicantById,
  updateApplicantById,
} from '../services/applicantService.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { generateApplicantNo } from '../helpers/generateApplicationNo.js';
import Applicant from '../models/applicantModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { commonSearch } from '../helpers/commonFunction/search.js';
import { Parser } from 'json2csv';



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
      query.expectedPkg = expectedPkg;
    }

    if (noticePeriod && typeof noticePeriod === 'string') {
      query.noticePeriod = noticePeriod;
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



export const exportInToCSV = async (req, res) => {
  try {
    const applicants = await getAllapplicant();

    if (!applicants.length) {
      logger.warn('Applicants not found');
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, 'Applicants not found');
    }

    // Define CSV fields
    const fields = [
      { label: 'First Name', value: (row) => row.name?.firstName || '' },
      { label: 'Middle Name', value: (row) => row.name?.middleName || '' },
      { label: 'Last Name', value: (row) => row.name?.lastName || '' },
      { label: 'Phone Number', value: (row) => row.phone?.phoneNumber || '' },
      { label: 'WhatsApp Number', value: (row) => row.phone?.whatsappNumber || '' },
      { label: 'Email', value: (row) => row.email || '' },
      { label: 'Gender', value: (row) => row.gender || '' },
      { label: 'Date of Birth', value: (row) => row.dateOfBirth || '' },
      { label: 'Qualification', value: (row) => row.qualification || '' },
      { label: 'Degree', value: (row) => row.degree || '' },
      { label: 'Passing Year', value: (row) => row.passingYear || '' },
      { label: 'Full Address', value: (row) => row.fullAddress || '' },
      { label: 'State', value: (row) => row.state || '' },
      { label: 'Country', value: (row) => row.country || '' },
      { label: 'Pincode', value: (row) => row.pincode || '' },
      { label: 'City', value: (row) => row.city || '' },
      { label: 'Applied Skills', value: (row) => row.appliedSkills?.join(', ') || '' },
      { label: 'Total Experience (months)', value: (row) => row.totalExperience || '' },
      { label: 'Relevant Skill Experience', value: (row) => row.relevantSkillExperience || '' },
      { label: 'Other Skills', value: (row) => row.otherSkills || '' },
      { label: 'Current Package', value: (row) => row.currentPkg || '' },
      { label: 'Expected Package', value: (row) => row.expectedPkg || '' },
      { label: 'Notice Period', value: (row) => row.noticePeriod || '' },
      { label: 'Negotiation', value: (row) => row.negotiation || '' },
      { label: 'Ready for Work (WFO)', value: (row) => row.readyForWork || '' },
      { label: 'Work Preference', value: (row) => row.workPreference || '' },
      { label: 'Referral', value: (row) => row.referral || '' },
      { label: 'Interview Stage', value: (row) => row.interviewStage || '' },
      { label: 'Status', value: (row) => row.status || '' },
      { label: 'About Us', value: (row) => row.aboutUs || '' },
      { label: 'Portfolio URL', value: (row) => row.portfolioUrl || '' }
    ];

    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(applicants);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applicants.csv');

    res.status(200).send(csvData);
    logger.info(Message.DONWLOADED)
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to export CSV file.');
  }
};


// export const importCsv = async (req, res) => {
//   try {

//   } catch (error) {

//   }
// }





