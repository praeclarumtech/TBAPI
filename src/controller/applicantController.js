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
import ExcelJS from 'exceljs'

export const addApplicant = async (req, res) => {
  try {
    const {
      name: { firstName, middleName, lastName },
      ...body
    } = req.body;

    let id = null
    if (req?.user) {
      const request = req?.user;
      id = request.id
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
      appliedSkills,
      totalExperience,
      startDate,
      endDate,
      city,
      interviewStage,
      expectedPkg,
      noticePeriod
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    let query = { isDeleted: false };

    if (applicationNo && !isNaN(applicationNo)) {
      query.applicationNo = parseInt(applicationNo);
    }

    if (appliedSkills) {
      const skillsArray = appliedSkills.split(',').map(skill => skill.trim());
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

    if (city && typeof city === "string") {
      query.city = { $regex: new RegExp(city, "i") };
    }

    if (interviewStage && typeof interviewStage === "string") {
      query.interviewStage = interviewStage;
    }

    if (expectedPkg && !isNaN(expectedPkg)) {
      query.expectedPkg = parseFloat(expectedPkg);
    }

    if (noticePeriod && !isNaN(noticePeriod)) {
      query.noticePeriod = parseFloat(noticePeriod);
    }

    const findYears = await pagination({
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
      findYears
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
    const {
      name: { firstName, middleName, lastName },
      ...body
    } = req.body;

    let updateData = { name: { firstName, middleName, lastName }, ...body };
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

export const exportInToExcell = async (req, res) => {
  try {
    const applicants = await getAllapplicant();
    console.log('all applicants are here', applicants)
    if (!applicants.length) {
      logger.warn(`Applicants are ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Applicants are ${Message.NOT_FOUND}`
      );
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('applicants');

    worksheet.columns = [
      { header: 'Name', key: 'name' },
      { header: 'Phone Number', key: 'phone' },
      { header: 'WhatsApp Number', key: 'whatsapp' },
      { header: 'Date of Birth', key: 'dob' },
      { header: 'Gender', key: 'gender' },
      { header: 'Full Address', key: 'fullAddress' },
      { header: 'Email', key: 'email' },
      { header: 'State', key: 'state' },
      { header: 'Country', key: 'country' },
      { header: 'City', key: 'city' },
      { header: 'Pincode', key: 'pincode' },
      { header: 'Qualification', key: 'qualification' },
      { header: 'Degree', key: 'degree' },
      { header: 'Passing Year', key: 'passingYear' },
      { header: 'Applied Skills', key: 'appliedSkills' },
      { header: 'Total Experience (months)', key: 'totalExperience' },
      { header: 'Relevant Skill Experience', key: 'relevantExperience' },
      { header: 'Other Skills', key: 'otherSkills' },
      { header: 'Current Package', key: 'currentPkg' },
      { header: 'Expected Package', key: 'expectedPkg' },
      { header: 'Notice Period', key: 'noticePeriod' },
      { header: 'Negotiation', key: 'negotiation' },
      { header: 'Ready for Work (WFO)', key: 'wfo' },
      { header: 'Work Preference', key: 'workPreference' },
      { header: 'Referral', key: 'referral' },
      { header: 'Interview Stage', key: 'interviewStage' },
      { header: 'Status', key: 'status' },
      { header: 'About Us', key: 'aboutUs' },
      { header: 'Portfolio URL', key: 'portfolioUrl' },
    ];

    applicants.forEach((applicant) => {
      worksheet.addRow({
        name: `${applicant.name?.firstName || ''} ${applicant.name?.middleName || ''} ${applicant.name?.lastName || ''}`,
        phone: applicant.phone || '',
        whatsapp: applicant.whatsapp || '',
        dob: applicant.dob || '',
        gender: applicant.gender || '',
        fullAddress: applicant.fullAddress || '',
        email: applicant.email || '',
        state: applicant.state || '',
        country: applicant.country || '',
        city: applicant.city || '',
        pincode: applicant.pincode || '',
        qualification: applicant.education.qualification || '',
        degree: applicant.education.degree || '',
        passingYear: applicant.education.passingYear || '',
        appliedSkills: applicant.appliedSkills.join(', ') || '',
        totalExperience: applicant.totalExperience || '',
        relevantExperience: applicant.relevantExperience || '',
        otherSkills: applicant.otherSkills || '',
        currentPkg: applicant.job.currentPkg || '',
        expectedPkg: applicant.job.expectedPkg || '',
        noticePeriod: applicant.job.noticePeriod || '',
        negotiation: applicant.job.negotiation || '',
        wfo: applicant.job.wfo || '',
        workPreference: applicant.job.workPreference || '',
        referral: applicant.job.referral || '',
        interviewStage: applicant.job.interviewStage || '',
        status: applicant.job.status || '',
        aboutUs: applicant.aboutUs || '',
        portfolioUrl: applicant.portfolioUrl || '',
      });
    });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=applicants.csv');

    const csvBuffer = await workbook.csv.writeBuffer();
    console.log('csv file', csvBuffer)
    res.send(csvBuffer);
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} export CSV file.`
    );
  }
};

