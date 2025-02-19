import logger from '../loggers/logger.js';
// import Applicant from '../models/applicantModel.js';
import { Message } from '../utils/message.js';
import { getDashboard } from '../services/dashboardService.js';
import { HandleResponse } from '../helpers/handaleResponse.js';
import { StatusCodes } from 'http-status-codes';

export const dashboard = async (req, res) => {
  try {
    const {
      totalApplicants,
      holdApplicants,
      pendingApplicants,
      selectedApplicants,
      rejectedApplicants,
      inProcessApplicants,
    } = await getDashboard();

    logger.info(Message.FETCHED_DASHBOARD);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHED_DASHBOARD,
      {
        totalApplicants,
        holdApplicants,
        pendingApplicants,
        selectedApplicants,
        rejectedApplicants,
        inProcessApplicants,
      }
    );
  } catch (error) {
    logger.error(`${Message.ERROR_FETCHING_DASHBOARD}: ${error.message}`, {
      stack: error.stack,
    });

    return HandleResponse(
      res,
      false,
      StatusCodes.SERVER_ERROR,
      Message.ERROR_FETCHING_DASHBOARD,
      error
    );
  }
};
