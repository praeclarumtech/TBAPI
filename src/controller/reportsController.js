import logger from '../loggers/logger.js';
// import Applicant from '../models/applicantModel.js';
import { Message } from '../utils/constant/message.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import {
  getApplicantSkillCounts,
  getApplicantCountCityAndState,
  getApplicantCountByAddedBy,
  getInterviewStageCount,
  getApplicationCount,
  getApplicantCountByRole,
  getApplicantByGenderWorkNotice,
} from '../services/reportService.js';

export const applicationOnProcessCount = async (req, res) => {
  const { calendarType, startDate, endDate } = req.query;
  const user = req.user;

  try {
    const interviewStageCount = await getInterviewStageCount(
      calendarType,
      startDate,
      endDate,
      user.role,
      user.id
    );

    logger.info(`Report data ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Report data ${Message.FETCH_SUCCESSFULLY}`,
      interviewStageCount
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} Fetching Report.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} Fetching Report.`,
      error
    );
  }
};

export const getApplicationsByDate = async (req, res) => {
  try {
    const { calendarType, startDate, endDate } = req.query;
    let count;

    logger.info(`Reports data ${Message.FETCH_SUCCESSFULLY}.`);

    if (!calendarType && !startDate && !endDate) {
      count = await getApplicationCount(null, null, null);
    } else {
      count = await getApplicationCount(calendarType, startDate, endDate);
    }

    logger.info(`Reports data ${Message.FETCH_SUCCESSFULLY}.`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Reports data ${Message.FETCH_SUCCESSFULLY}.`,
      {
        calendarType:
          calendarType || (startDate ? 'custom (start to today)' : 'all'),
        totalApplications: count,
      }
    );
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} Fetching Report.`,
      error
    );
  }
};

export const applicantSkillStatistics = async (req, res) => {
  try {
    const { skillIds } = req.body;
    const user = req.user;

    const skillCounts = await getApplicantSkillCounts(skillIds, user);

    logger.info(`Applicant Skill Statistics ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant Skill Statistics ${Message.FETCH_SUCCESSFULLY}`,
      skillCounts
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} fetch applicant skill statistics: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch skill statistics',
      error
    );
  }
};

export const applicantCountByCityAndState = async (req, res) => {
  try {
    const { type } = req.query;
    const result = await getApplicantCountCityAndState(type, req.user);
    logger.info(`Applicant count by ${type} ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant count by ${type} ${Message.FETCH_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} fetch applicant count by ${
        req.query.type || 'city'
      }: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicant count by ${
        req.query.type || 'city'
      }.`,
      error
    );
  }
};

export const applicantCountByAddedBy = async (req, res) => {
  try {
    const { startDate, endDate, currentCompanyDesignation } = req.query;

    const result = await getApplicantCountByAddedBy(
      startDate,
      endDate,
      currentCompanyDesignation
    );

    logger.info(`Applicant count by addedBy ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant count by addedBy ${Message.FETCH_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} fetch applicant count by addedBy: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicant count by addedBy`,
      error
    );
  }
};

export const applicantCountByRole = async (req, res) => {
  try{
    const {role}=req.query;
    const result = await getApplicantCountByRole(role, req.user);
    logger.info(`Applicant count by role ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant count by role ${Message.FETCH_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} fetch applicant count by role: ${error.message}`
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicant count by role`,
      error
    );
  }
};

export const getApplicationsByGenderWorkNotice = async (req, res) => {
  try {
    const { gender, workPreference, noticePeriod } = req.query;

    const applicants = await getApplicantByGenderWorkNotice({
      gender,
      workPreference,
      noticePeriod,
    });

    if (!applicants) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'No applicants found'
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Applicants fetched successfully',
      { applicants }
    );
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error fetching applicant data',
      { error: error.message }
    );
  }
};
