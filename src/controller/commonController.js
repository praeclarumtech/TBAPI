import { getAllcountry, getAllstates } from '../services/commonService.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';

export const viewCountry = async (req, res) => {
  try {
    const countries = await getAllcountry();
    logger.info(`All countries are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHING_COUNTRIES,
      countries
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch countries`);
    return HandleResponse(
      res,
      false,
      StatusCodes.SERVER_ERROR,
      `${Message.FAILED_TO} fetch countries`,
      undefined,
      error
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
