import logger from '../loggers/logger.js';
// import Applicant from '../models/applicantModel.js';
import { Message } from '../utils/constant/message.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import {
  getReport,
  getApplicantSkillCounts,
} from '../services/reportService.js';

export const applicationOnProcessCount = async (req, res) => {
  const { calendarType, startDate, endDate } = req.query;

  try {
    const {
      hrRoundApplicants,
      firstInterviewRoundApplicants,
      clientInterviewApplicants,
      technicalRoundApplicants,
      practicalRoundApplicants,
    } = await getReport(calendarType, startDate, endDate);

    logger.info(`Report data ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Report data ${Message.FETCH_SUCCESSFULLY}`,
      {
        hrRoundApplicants,
        firstInterviewRoundApplicants,
        clientInterviewApplicants,
        technicalRoundApplicants,
        practicalRoundApplicants,
      }
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

export const statusByPercentage = async (req, res) => {
  try {
    const { calendarType, startDate, endDate } = req.query;

    const {
      holdApplicants,
      pendingApplicants,
      selectedApplicants,
      rejectedApplicants,
      inProcessApplicants,
    } = await getReport(calendarType, startDate, endDate);

    logger.info(`Report data ${Message.FETCH_SUCCESSFULLY}.`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Report data ${Message.FETCH_SUCCESSFULLY}.`,
      {
        holdApplicants,
        pendingApplicants,
        selectedApplicants,
        rejectedApplicants,
        inProcessApplicants,
      }
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

    const skillCounts = await getApplicantSkillCounts(skillIds);

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
      `Failed to fetch skill statistics`,
      error
    );
  }
};
