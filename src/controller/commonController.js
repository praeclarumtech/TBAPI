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
      const query = country_id ? { country_id } : {}

      const states = await getAllstates(query);
  
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

  export const viewCity = async (req, res) => { 
    try {
      const { state_id } = req.query;
      const query = state_id ? { state_id } : {}

      const City = await getAllCity(query);
  
      logger.info(Message.FETCHING_CITIES);
      return HandleResponse(res, true, StatusCodes.OK, undefined, City);
    } catch (error) {
      logger.error(`Error fetching cities: ${error.message}`, {
        stack: error.stack,
      });
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        Message.ERROR_FETCHING_CITIES,
        undefined,
        error
      );      
    }
  };        
