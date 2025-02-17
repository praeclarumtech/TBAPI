import country from "../models/countryModel.js";
import states from "../models/stateModel.js";

export const getAllcountry = async () => {
    return country.find();
  };

  // return await Country.find({}, { _id: 0, name: 1, code: 1 }); 

  export const getAllstates = async () => {
    return states.find();
  };