import country from '../models/countryModel.js';
import states from '../models/stateModel.js';

export const getAllcountry = async () => {
    return country.find();
  };

  export const getAllstates = async () => {
    return states.find();
  };