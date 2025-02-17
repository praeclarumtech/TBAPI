import logger from "../loggers/logger.js";
// import Applicant from "../models/applicantModel.js";
import { Message } from "../utils/message.js";
import { getDashboard } from "../services/dashboardService.js";
import { HandleResponse } from "../helpers/handaleResponse.js";
import { StatusCodes } from "http-status-codes";


export const dashboard = async (req, res) => {
    try {
      
      const { totalApplicants, holdApplicants, pendingApplicants, selectedApplicants, rejectedApplicants, inProcessApplicants} = await getDashboard();

    logger.info(Message.FETCHED_DASHBOARD);
      HandleResponse(
        res,
        true,
        StatusCodes.OK,
        Message.FETCHED_DASHBOARD,
        {totalApplicants, holdApplicants, pendingApplicants, selectedApplicants, rejectedApplicants, inProcessApplicants}
      );
    } catch (error) {
      logger.error(`${Message.ERROR_FETCHING_DASHBOARD}: ${error.message}`, {
        stack: error.stack,
      });

      return HandleResponse(
        false,
        StatusCodes.SERVER_ERROR,
        Message.ERROR_FETCHING_DASHBOARD,
        error,
      );
    }
  };

  export const dashboardProcess = async (req, res) => {
    try {
      const { hrRoundPercentage } = await getDashboard();

    logger.info(Message.FETCHED_DASHBOARD);
      HandleResponse(
        res,
        true,
        StatusCodes.OK,
        Message.FETCHED_DASHBOARD,
        { hrRoundPercentage: `${hrRoundPercentage}%`}
      );
    } catch (error) {
      logger.error(`${Message.ERROR_FETCHING_DASHBOARD}: ${error.message}`, {
        stack: error.stack,
      });

      return HandleResponse(
        false,
        StatusCodes.SERVER_ERROR,
        Message.ERROR_FETCHING_DASHBOARD,
        error,
      );
    }
  };
