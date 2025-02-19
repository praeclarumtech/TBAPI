import logger from '../loggers/logger.js';
// import Applicant from '../models/applicantModel.js';
import { Message } from '../utils/constant/message.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes'; 
import { getDashboard } from '../services/dashboardService.js';

export const applicationOnProcessCount = async (req, res) => {
  try {
    const {
      hrRoundPercentage,
      // firstInterviewPercentage,
      // secondterviewPercentage,
      technicalRoundPercentage,
      finalRoundPercentage,
    } = await getDashboard();

    logger.info(Message.FETCHED_REPORTS);
    return HandleResponse(res, true, StatusCodes.OK, Message.FETCHED_REPORTS, {
      hrRoundPercentage: `${hrRoundPercentage}%`,
      // firstInterviewPercentage: `${firstInterviewPercentage}%`,
      // secondterviewPercentage:`${secondterviewPercentage}%`,
      technicalRoundPercentage: `${technicalRoundPercentage}%`,
      finalRoundPercentage: `${finalRoundPercentage}%`,
    });
  } catch (error) {
    logger.error(`${Message.ERROR_FETCHING_REPORTS}: ${error.message}`, {
      stack: error.stack,
    });

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.ERROR_FETCHING_REPORTS,
      error
    );
  }
};

export const statusByPercentage = async (req, res) => {
  try {
    const {
      holdApplicantsPercentage,
      pendingApplicantsPercentage,
      selectedApplicantsPercentage,
      rejectedApplicantsPercentage,
      inProcessApplicantsPercentage,
    } = await getDashboard();

    logger.info(Message.FETCHED_REPORTS);
    return HandleResponse(res, true, StatusCodes.OK, Message.FETCHED_REPORTS, {
      holdApplicantsPercentage: `${holdApplicantsPercentage}%`,
      pendingApplicantsPercentage: `${pendingApplicantsPercentage}%`,
      selectedApplicantsPercentage: `${selectedApplicantsPercentage}%`,
      rejectedApplicantsPercentage: `${rejectedApplicantsPercentage}%`,
      inProcessApplicantsPercentage: `${inProcessApplicantsPercentage}%`,
    });
  } catch (error) {
    logger.error(`${Message.ERROR_FETCHING_REPORTS}: ${error.message}`, {
      stack: error.stack,
    });

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.ERROR_FETCHING_REPORTS,
      error
    );
  }
};

export const technologyStatistics = async (req, res) => {
  try {
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
    } = await getDashboard();

    logger.info(Message.FETCHED_REPORTS);
    return HandleResponse(res, true, StatusCodes.OK, Message.FETCHED_REPORTS, {
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
    logger.error(`${Message.ERROR_FETCHING_REPORTS}: ${error.message}`, {
      stack: error.stack,
    });

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.ERROR_FETCHING_REPORTS,
      error
    );
  }
};
