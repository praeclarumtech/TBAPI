import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import {
  getDashboard,
  getApplicantsByMonth,
} from '../services/dashboardService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
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

    logger.info(`Dashboard data ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Dashboard data ${Message.FETCH_SUCCESSFULLY}`,
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
    logger.error(`${Message.FAILED_TO} fetch dashboard data`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      undefined,
      error
    );
  }
};

export const applicantDetails = async (req, res) => {
  try {
    const { month, year } = req.query;

    const { totalApplicantsInMonth, percentage } = await getApplicantsByMonth(
      month,
      year
    );

    logger.info(`Dashboard data ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Dashboard data ${Message.FETCH_SUCCESSFULLY}`,
      {
        totalApplicantsInMonth,
        percentage: `${percentage}%`,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch dashboard data`, error);

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      error
    );
  }
};
