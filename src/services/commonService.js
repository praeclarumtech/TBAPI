import country from '../models/countryModel.js';
import states from '../models/stateModel.js';

export const getAllcountry = async () => {
    return await country.find();
  };

  export const getAllstates = async (body) => {
    return await states.find(body);
  };