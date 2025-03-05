import { getAllcountry, getAllstates, getAllCity } from '../services/commonService.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';


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

    logger.info(`All states are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, `All states are ${Message.FETCH_SUCCESSFULLY}`, states);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetching states.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetching states.`,
      undefined,
      error
    );
  }
};

export const viewCity = async (req, res) => {
  try {
    const { state_id } = req.query;
    const City = await getAllCity({ state_id });

    logger.info(`All cities are${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, `All cities are ${Message.FETCH_SUCCESSFULLY}`, City);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetching cities`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetching cities`
    );
  }
};        
