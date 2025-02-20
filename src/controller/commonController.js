import { getAllcountry, getAllstates } from '../services/commonService.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';

export const viewCountry = async (req, res) => {
    try {
      const  countries = await getAllcountry();
      logger.info(Message.FETCHING_COUNTRI);
       return HandleResponse(
              res,
              true,
              StatusCodes.OK,
              Message.FETCHING_COUNTRI,
              countries
            );
    } catch (error) {
        logger.error(`${Message.ERROR_FETCHING_COUNTRI}: ${error.message}`, {stack: error.stack,});
        return HandleResponse(
          res,
          false,
          StatusCodes.INTERNAL_SERVER_ERROR,
          Message.ERROR_FETCHING_COUNTRI,
          error,
        );
    }
  };

  export const viewState = async (req, res) => {
    try {
      const { country_id } = req.query;
      const states = await getAllstates({ country_id });
  
      logger.info(Message.FETCHING_STATES);
      return HandleResponse(res, true, StatusCodes.OK, undefined, states);
    } catch (error) {
      logger.error(`Error fetching states: ${error.message}`, {
        stack: error.stack,
      });
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        Message.ERROR_FETCHING_STATES,
        undefined,
        error
      );
    }
  };