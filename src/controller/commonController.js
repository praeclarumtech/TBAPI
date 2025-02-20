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
    const states = await getAllstates();
    logger.info(`All states are ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All states are ${Message.FETCH_SUCCESSFULLY}`,
      states
    );
  } catch (error) {
    logger.error(`Error fetching states ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.SERVER_ERROR,
      `Error fetching states ${Message.FETCH_SUCCESSFULLY}`,
      undefined,
      error
    );
  }
};
