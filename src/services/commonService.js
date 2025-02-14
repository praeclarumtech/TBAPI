import country from "../models/commonModel.js";

export const getAllcountry = async () => {
    return country.find();
  };