import country from '../models/countryModel.js';
import states from '../models/stateModel.js';
import city from '../models/citymodel.js';

export const getAllcountry = async () => {
    return await country.find().sort({ country_name: 1 });
  };

  export const getAllstates = async (body) => {
    return await states.find(body).sort({ state_name: 1 });
  };

  export const getAllCity = async (body) => {   
    return await city.find(body).sort({ city_name: 1 });
  };  