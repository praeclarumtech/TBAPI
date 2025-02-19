import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import { getDashboard } from '../services/dashboardService.js';
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
      StatusCodes.SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      undefined,
      error
    );
  }
};

export const dashboardProcess = async (req, res) => {
  try {
    const { hrRoundPercentage } = await getDashboard();

    logger.info(Message.FETCHED_DASHBOARD);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHED_DASHBOARD,
      { hrRoundPercentage: `${hrRoundPercentage}%` }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch dashboard data`);
    return HandleResponse(
      res,
      false,
      StatusCodes.SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      undefined,
      error
    );
  }
};
