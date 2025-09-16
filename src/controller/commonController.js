import {
  createCountry,
  getCountryById,
  updateCountry,
  deleteCountry,
  deleteManyCountry,
  createState,
  updateState,
  deleteState,
  deleteManyState,
  getStateById,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  deleteManyCity,
} from '../services/commonService.js';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import states from '../models/stateModel.js';
import country from '../models/countryModel.js';
import city from '../models/citymodel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import { HandleResponse } from '../helpers/handleResponse.js';

export const viewCountry = async (req, res) => {
  try {
    const { page = 1, limit , search = ''} = req.query;
    const query = {};

     if (search) {
      query.country_name = { $regex: search, $options: 'i' };
    }

     const countries = await pagination({
      Schema: country,
      page: parseInt(page),
      limit: parseInt(limit),
      query: query,
      sort:  { country_name: 1 },
    });
  
    logger.info(`All countries are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCHING_COUNTRIES,
      countries
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch countries`,error);
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

export const addCountry = async (req, res) => {
  try {
    const { country_name } = req.body;
    if (!country_name) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Country name is required.'
      );
    }

    const existingCountry = await country.findOne({
      country_name: { $regex: `^${country_name}$`, $options: 'i' },
    });
    if (existingCountry) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'Country already exists!.'
      );
    }

    const newCountry = await createCountry({ country_name });
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      'Country added successfully',
      newCountry
    );
  } catch (error) {
    logger.error(`Error adding country: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to add country',
      undefined,
      error
    );
  }
};

export const updateCountryById = async (req, res) => {
  try {
    const { countryId } = req.params;
    const updateData = req.body;

    const existing = await country.findOne({
      _id: { $ne: countryId },
      country_name: { $regex: new RegExp(`^${updateData.country_name}$`, 'i') },
    });

    if (existing) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        `country name ${Message.ALREADY_EXIST}!`
      );
    }

    const updatedcountrys = await updateCountry(countryId, updateData);

    logger.info(`country  is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `country is ${Message.UPDATED_SUCCESSFULLY}`,
      updatedcountrys
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update country.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update country.`
    );
  }
};

export const deleteCountryById = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteCountry(id);
    if (!deleted) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Country not found'
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Country deleted successfully',
      deleted
    );
  } catch (error) {
    logger.error(`Error deleting country: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to delete country',
      undefined,
      error
    );
  }
};

export const deleteManyCountries = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'IDs are required for deletion'
      );
    }

    const result = await deleteManyCountry(ids);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Countries deleted successfully',
      result
    );
  } catch (error) {
    logger.error(`Error deleting multiple countries: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to delete multiple countries',
      undefined,
      error
    );
  }
};

export const viewCountryById = async (req, res) => {
  try {
    const { id } = req.params;

    const countryData = await getCountryById(id);
    if (!countryData) {
      logger.warn(`Country is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Country is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Country is ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Country is ${Message.FETCH_BY_ID}`,
      countryData
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch country by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch country by id.`,
      undefined,
      error
    );
  }
};

export const viewState = async (req, res) => {
  try {
    const { country_id, page = 1, limit, search = '' } = req.query;
    const query ={}

    if (country_id) query.country_id = country_id;

     if (search) {
      query.state_name = { $regex: search, $options: 'i' };
    }

    const state = await pagination({
      Schema: states,
      page: parseInt(page),
      limit: parseInt(limit),
      query: query,
      sort:  { state_name: 1 },
    });

    logger.info(`All states are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, undefined, state);
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

export const addState = async (req, res) => {
  try {
    const { state_name, country_id } = req.body;

    if (!state_name || !country_id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.FIELD_REQUIRED
      );
    }

    if (!mongoose.Types.ObjectId.isValid(country_id)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid country_id format'
      );
    }

    const countryExists = await getCountryById(country_id);
    if (!countryExists) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'Country not found'
      );
    }

    const existingState = await states.findOne({
      state_name: { $regex: new RegExp(`^${state_name}$`, 'i') },
      country_id: country_id,
    });

    if (existingState) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'State already exists for the given country'
      );
    }

    const result = await createState({ state_name, country_id });

    logger.info(`State ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `State ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add state: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add state`,
      undefined,
      error
    );
  }
};

export const updateStateById = async (req, res) => {
  try {
    const { stateId } = req.params;
    const { state_name, country_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(stateId)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid stateId format'
      );
    }
    if (!state_name || !country_id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `state name and country id Message.FIELD_REQUIRED`
      );
    }

    if (!mongoose.Types.ObjectId.isValid(country_id)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid country_id format'
      );
    }

    const existingState = await states.findOne({
      _id: { $ne: stateId },
      state_name: { $regex: new RegExp(`^${state_name}$`, 'i') },
      country_id: country_id,
    });

    if (existingState) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'Another state with this name already exists in the selected country'
      );
    }

    const updatedState = await updateState(stateId, { state_name, country_id });

    logger.info(`State ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `State ${Message.UPDATED_SUCCESSFULLY}`,
      updatedState
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update state: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update state`,
      undefined,
      error
    );
  }
};

export const deleteStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteState(id);

    if (result.deletedCount === 0) {
      logger.warn(`State is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `State is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`State is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `State is ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete state: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete state`,
      undefined,
      error
    );
  }
};

export const deleteManyStates = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(`ObjectId is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OBJ_ID_NOT_FOUND
      );
    }

    const result = await deleteManyState(ids);

    if (result.deletedCount === 0) {
      logger.warn(`States are ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `States are ${Message.NOT_FOUND}`
      );
    }

    logger.info(`States are ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `States are ${Message.DELETED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} delete many states: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} delete many states`,
      undefined,
      error
    );
  }
};

export const viewCity = async (req, res) => {
  try {
    const { state_id ,page = 1, limit, search = ''} = req.query;
     const query = {};
    if (state_id) query.state_id = state_id;

     if (search) {
      query.city_name = { $regex: search, $options: 'i' };
    }

     const citys = await pagination({
      Schema: city,
      page: parseInt(page),
      limit: parseInt(limit),
      query: query,
      sort: {city_name : 1},
    });

    logger.info(`All cities are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(res, true, StatusCodes.OK, undefined, citys);
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

export const viewStateById = async (req, res) => {
  try {
    const { id } = req.params;

    const stateData = await getStateById(id);
    if (!stateData) {
      logger.warn(`State is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `State is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`State ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `State ${Message.FETCH_BY_ID}`,
      stateData
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch state by id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch state by id.`,
      undefined,
      error
    );
  }
};

export const addCity = async (req, res) => {
  try {
    const { city_name, state_id } = req.body;

    if (!city_name || !state_id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `city name and state id Message.FIELD_REQUIRED`
      );
    }

    if (!mongoose.Types.ObjectId.isValid(state_id)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid state_id format'
      );
    }

    const stateExists = await getStateById(state_id);
    if (!stateExists) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'State not found'
      );
    }

    const existingCity = await city.findOne({
      city_name: { $regex: new RegExp(`^${city_name}$`, 'i') },
      state_id: state_id,
    });

    if (existingCity) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'City already exists for the given state'
      );
    }

    const result = await createCity({ city_name, state_id });

    logger.info(`City ${Message.ADDED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `City ${Message.ADDED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} add city: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} add city`,
      undefined,
      error
    );
  }
};

export const viewCityById = async (req, res) => {
  try {
    const { id } = req.params;
    const cityData = await getCityById(id);

    if (!cityData) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        'City not found'
      );
    }

    logger.info(`City fetched successfully`);
    return HandleResponse(res, true, StatusCodes.OK, undefined, cityData);
  } catch (error) {
    logger.error(`Error fetching city by ID: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error fetching city',
      undefined,
      error
    );
  }
};

export const updateCityById = async (req, res) => {
  try {
    const { city_id } = req.params;
    const { city_name, state_id } = req.body;

    if (!city_name || !state_id) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `city anme and stated id ${Message.FIELD_REQUIRED}`
      );
    }

    if (!mongoose.Types.ObjectId.isValid(city_id)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid city_id format'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(state_id)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid state_id format'
      );
    }

    const duplicateCity = await city.findOne({
      _id: { $ne: city_id },
      city_name: { $regex: new RegExp(`^${city_name}$`, 'i') },
      state_id: state_id,
    });

    if (duplicateCity) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'Another city with the same name exists in this state'
      );
    }

    const result = await updateCity(city_id, { city_name, state_id });

    logger.info(`City is ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `City is ${Message.UPDATED_SUCCESSFULLY}`,
      result
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update city: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update city`,
      undefined,
      error
    );
  }
};

export const deleteCityById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteCity(id);

    logger.info(`City deleted successfully`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'City deleted successfully',
      result
    );
  } catch (error) {
    logger.error(`Error deleting city: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error deleting city',
      undefined,
      error
    );
  }
};

export const deleteManyCities = async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await deleteManyCity(ids);

    logger.info(`Cities deleted successfully`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Cities deleted successfully',
      result
    );
  } catch (error) {
    logger.error(`Error deleting multiple cities: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error deleting cities',
      undefined,
      error
    );
  }
};
