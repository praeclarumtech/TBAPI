import country from '../models/countryModel.js';
import states from '../models/stateModel.js';
import city from '../models/citymodel.js';

export const getAllcountry = async () => {
    return await country.find();
  };

  export const getAllstates = async (body) => {
    return await states.find(body);
  };

  export const getAllCity = async (body) => {   
    return await city.find(body);
  };  