import mongoose from 'mongoose';
import { countryEnum } from '../utils/enum.js';

const countrySchema = new mongoose.Schema(
  {
    name : {
      type: String,
      enum: Object.values(countryEnum),
      required: true,
    }
  }
);

const  country= mongoose.model('country', countrySchema,'country');
// const country = mongoose.model('country', countrySchema, 'country');

export default country;
