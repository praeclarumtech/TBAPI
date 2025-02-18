import logger from "../loggers/logger.js";
// import Applicant from "../models/applicantModel.js";
import { Message } from "../utils/message.js";
import { getDashboard } from "../services/dashboardService.js";
import { HandleResponse } from "../helpers/handaleResponse.js";
import { StatusCodes } from "http-status-codes";

export const reports = async (req, res) => {
    try {
    
      const { hrRoundPercentage, 
        // firstInterviewPercentage, 
        // secondterviewPercentage, 
        technicalRoundPercentage, finalRoundPercentage} = await getDashboard();

    logger.info(Message.FETCHED_DASHBOARD);
      HandleResponse(
        res,
        true,
        StatusCodes.OK,
        Message.FETCHED_DASHBOARD,
        { hrRoundPercentage: `${hrRoundPercentage}%`, 
        // firstInterviewPercentage: `${firstInterviewPercentage}%`, 
        // secondterviewPercentage:`${secondterviewPercentage}%`, 
        technicalRoundPercentage:`${technicalRoundPercentage}%`, finalRoundPercentage:`${finalRoundPercentage}%`}
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
        error,
      );
    }
  };

  export const statusByPercentage = async (req, res) => {
    try {
    
      const { holdApplicantsPercentage, pendingApplicantsPercentage, selectedApplicantsPercentage, rejectedApplicantsPercentage, inProcessApplicantsPercentage} = await getDashboard();

    logger.info(Message.FETCHED_DASHBOARD);
      HandleResponse(
        res,
        true,
        StatusCodes.OK,
        Message.FETCHED_DASHBOARD,
        { holdApplicantsPercentage:`${holdApplicantsPercentage}%`, pendingApplicantsPercentage:`${pendingApplicantsPercentage}%`, selectedApplicantsPercentage:`${selectedApplicantsPercentage}%`, rejectedApplicantsPercentage:`${rejectedApplicantsPercentage}%`, inProcessApplicantsPercentage:`${inProcessApplicantsPercentage}%`}
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
        error,
      );
    }
  };