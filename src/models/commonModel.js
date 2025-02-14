import mongoose from 'mongoose';
import { countryEnum } from '../utils/enum.js';

const countrySchema = new mongoose.Schema(
  {
    country : {
      type: String,
      enum: [countryEnum.INDIA,countryEnum.CANADA],
      required: true,
    }
  }
);

const  country= mongoose.model('country', countrySchema);
export default country;
