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
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.ERROR_FETCHING_DASHBOARD,
      error
    );
  }
};

export const applicantDetails = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const { applicantsInRange, totalApplicants, percentage } =
      await getApplicantsDetailsByDate(startDate, endDate);

    logger.info(Message.FETCHED_DASHBOARD);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHED_DASHBOARD,
      {
        applicantsInRange,
        // totalApplicants,
        percentage: `${percentage}%`,
      }
    );
  } catch (error) {
    logger.error(`${Message.ERROR_FETCHING_DASHBOARD}: ${error.message}`, {
      stack: error.stack,
    });

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      Message.INTERNAL_SERVER_ERROR,
      error
    );
  }
};
