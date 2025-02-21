import logger from "../loggers/logger.js";
// import Applicant from '../models/applicantModel.js';
import { Message } from "../utils/constant/message.js";
import {
  getDashboard,
  getApplicantsDetailsByDate,
} from "../services/dashboardService.js";
import { HandleResponse } from "../helpers/handleResponse.js";
import { StatusCodes } from "http-status-codes";

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
    const { startDate, endDate } = req.body;

    const { applicantsInRange, totalApplicants, percentage } =
      await getApplicantsDetailsByDate(startDate, endDate);

    logger.info(`Dashboard data ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Dashboard data ${Message.FETCH_SUCCESSFULLY}`,
      {
        applicantsInRange,
        // totalApplicants,
        percentage: `${percentage}%`,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch dashboard data`);

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      error
    );
  }
};
