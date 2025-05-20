import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema(
  {
    country_name : {
      type: String,
      unique: true
    }
  }
);

const country = mongoose.model('country', countrySchema,'country');

export default country;