import logger from '../loggers/logger.js';
// import Applicant from '../models/applicantModel.js';
import { Message } from '../utils/constant/message.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import {getReport } from '../services/reportService.js';
import { getApplicationCount } from '../services/reportService.js';

export const applicationOnProcessCount = async (req, res) => {
  const { calendarType, startDate, endDate } = req.query;

  try {
    const {
      hrRoundPercentage,
      // firstInterviewPercentage,
      // secondterviewPercentage,
      technicalRoundPercentage,
      finalRoundPercentage,
    } = await getReport(calendarType, startDate, endDate);

    logger.info(`Report data ${Message.FETCH_SUCCESSFULLY}`);
    
    return HandleResponse(res, true, StatusCodes.OK, `Report data ${Message.FETCH_SUCCESSFULLY}`, {
      hrRoundPercentage: `${hrRoundPercentage}%`,
      // firstInterviewPercentage: `${firstInterviewPercentage}%`,
      // secondterviewPercentage:`${secondterviewPercentage}%`,
      technicalRoundPercentage: `${technicalRoundPercentage}%`,
      finalRoundPercentage: `${finalRoundPercentage}%`,
    });
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
      holdApplicantsPercentage,
      pendingApplicantsPercentage,
      selectedApplicantsPercentage,
      rejectedApplicantsPercentage,
      inProcessApplicantsPercentage,
    } = await getReport(calendarType, startDate, endDate);

    logger.info(`Report data ${Message.FETCH_SUCCESSFULLY}.`);
    return HandleResponse(res, true, StatusCodes.OK, `Report data ${Message.FETCH_SUCCESSFULLY}.`, {
      holdApplicantsPercentage: `${holdApplicantsPercentage}%`,
      pendingApplicantsPercentage: `${pendingApplicantsPercentage}%`,
      selectedApplicantsPercentage: `${selectedApplicantsPercentage}%`,
      rejectedApplicantsPercentage: `${rejectedApplicantsPercentage}%`,
      inProcessApplicantsPercentage: `${inProcessApplicantsPercentage}%`,
    });
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

export const technologyStatistics = async (req, res) => {
  try {

    const { calendarType, startDate, endDate } = req.query;

    const {
      nodeJsApplicantsPercentage,
      reactJsApplicantsPercentage,
      dotNetApplicantsPercentage,
      angularApplicantsPercentage,
      uiuxApplicantsPercentage,
      pythonApplicantsPercentage,
      javaScriptApplicantsPercentage,
      javaApplicantsPercentage,
      cApplicantsPercentage,
    } = await getReport(calendarType, startDate, endDate);

    logger.info(`Report data ${Message.FETCH_SUCCESSFULLY}.`);
    return HandleResponse(res, true, StatusCodes.OK, `Report data ${Message.FETCH_SUCCESSFULLY}.`, {
      nodeJsApplicantsPercentage: `${nodeJsApplicantsPercentage}%`,
      reactJsApplicantsPercentage: `${reactJsApplicantsPercentage}%`,
      dotNetApplicantsPercentage: `${dotNetApplicantsPercentage}%`,
      angularApplicantsPercentage: `${angularApplicantsPercentage}%`,
      uiuxApplicantsPercentage: `${uiuxApplicantsPercentage}%`,
      pythonApplicantsPercentage: `${pythonApplicantsPercentage}%`,
      javaScriptApplicantsPercentage: `${javaScriptApplicantsPercentage}%`,
      javaApplicantsPercentage: `${javaApplicantsPercentage}%`,
      cApplicantsPercentage: `${cApplicantsPercentage}%`,
    });
  } catch (error) {
    logger.error(`${Message.FAILED_TO} Fetching Report.: ${error.message}`, {
      stack: error.stack,
    });

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
            calendarType: calendarType || (startDate ? "custom (start to today)" : "all"),
            totalApplications: count
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

