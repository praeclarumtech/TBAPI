import country from '../models/countryModel.js';
import states from '../models/stateModel.js';
import city from '../models/citymodel.js';

  export const getAllcountry = async () => {
    try {
      return await country.find().sort({ country_name: 1 });
    } catch (error) {
      throw new Error(`Failed to fetch countries: ${error.message}`);
    }
  };

  export const createCountry = async (body) => {
    try {
      const newCountry = new country(body);
      return await newCountry.save();
    } catch (error) {
      throw new Error(`Failed to add country: ${error.message}`);
    }
  };
  
  export const getCountryById = async (id) => {
    try {
      return await country.findOne({ _id: id });
    } catch (error) {
      throw new Error(`Failed to get country by ID: ${error.message}`);
    }
  };
  
  export const updateCountry = async (id, updateData) => {
    try {
      return await country.updateOne({ _id: id }, updateData);
    } catch (error) {
      throw new Error(`Failed to update country: ${error.message}`);
    }
  };

  export const deleteCountry = async (id) => {
    try {
      return await country.deleteOne({ _id: id });
    } catch (error) {
      throw new Error(`Failed to delete country: ${error.message}`);
    }
  };
  
  export const deleteManyCountry = async (ids) => {
    try {
      return await country.deleteMany({ _id: { $in: ids } });
    } catch (error) {
      throw new Error(`Failed to delete multiple countries: ${error.message}`);
    }
  };

  export const getAllstates = async (body) => {
    try{
    return await states.find(body).sort({ state_name: 1 });
    }catch(error){
      throw new Error(`Failed to view all states : ${error.message}`);
    }
  };

  export const getAllCity = async (body) => {
    try{   
    return await city.find(body).sort({ city_name: 1 });
    }catch(error){
      throw new Error(`Failed to view all city: ${error.message}`);
    }
  };  

  export const createState = async (body) => {
    try {
      const newState = new states(body);
      return await newState.save();
    } catch (error) {
      throw new Error(`Failed to add state: ${error.message}`);
    }
  };
  
  export const updateState = async (id, updateData) => {
    try {
      return await states.updateOne({ _id: id }, updateData);
    } catch (error) {
      throw new Error(`Failed to update state: ${error.message}`);
    }
  };
  
  export const deleteState = async (id) => {
    try {
      return await states.deleteOne({ _id: id });
    } catch (error) {
      throw new Error(`Failed to delete state: ${error.message}`);
    }
  };
  
  export const deleteManyState = async (ids) => {
    try {
      return await states.deleteMany({ _id: { $in: ids } });
    } catch (error) {
      throw new Error(`Failed to delete multiple states: ${error.message}`);
    }
  };

  export const createCity = async (body) => {
  try {
    const newCity = new city(body);
    return await newCity.save();
  } catch (error) {
    throw new Error(`Failed to add city: ${error.message}`);
  }
};


  export const getStateById = async (id) => {
    try {
      return await states.findOne({ _id: id });
    } catch (error) {
      throw new Error(`Failed to get state by ID: ${error.message}`);
    }
  };

  export const getCityById = async (id) => {
  try {
    return await city.findOne({ _id: id });
  } catch (error) {
    throw new Error(`Failed to get city by ID: ${error.message}`);
  }
};

export const updateCity = async (id, updateData) => {
  try {
    return await city.updateOne({ _id: id }, updateData);
  } catch (error) {
    throw new Error(`Failed to update city: ${error.message}`);
  }
};

export const deleteCity = async (id) => {
  try {
    return await city.deleteOne({ _id: id });
  } catch (error) {
    throw new Error(`Failed to delete city: ${error.message}`);
  }
};

export const deleteManyCity = async (ids) => {
  try {
    return await city.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    throw new Error(`Failed to delete multiple cities: ${error.message}`);
  }
};

  