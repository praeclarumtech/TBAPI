import { getAllcountry, getAllstates } from '../services/commonService.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';

export const viewCountry = async (req, res) => {
    try {
      const  countries = await getAllcountry();
      logger.info(Message.FETCHING_COUNTRIES);
       return HandleResponse(
              res,
              true,
              StatusCodes.OK,
              Message.FETCHING_COUNTRIES,
              countries
            );
    } catch (error) {
        logger.error(`${Message.ERROR_FETCHING_COUNTRIES}: ${error.message}`, {stack: error.stack,});
        return HandleResponse(
          res,
          false,
          StatusCodes.SERVER_ERROR,
          Message.ERROR_FETCHING_COUNTRIES,
          undefined,
          error,
        );
    }
  };

  export const viewState = async (req, res) => {
    try {
      const  states = await getAllstates();
      logger.info(Message.FETCHING_STATES);
     return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        Message.FETCHING_STATES,
        states
      );
    } catch (error) {
        logger.error(`Error fetching states: ${error.message}`, {stack: error.stack,});
        return HandleResponse(
          res,
          false,
          StatusCodes.SERVER_ERROR,
          Message.ERROR_FETCHING_STATES,
          undefined,
          error,
        );
    }
  };