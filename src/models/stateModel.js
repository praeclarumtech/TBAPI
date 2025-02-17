import mongoose from 'mongoose';
import { stateEnum } from '../utils/enum.js';

const stateSchema = new mongoose.Schema(
  {
    name : {
      type: String,
      enum: Object.values(stateEnum),
      required: true,
    }
  }
);

const  states= mongoose.model('states', stateSchema);
// const country = mongoose.model('country', countrySchema, 'country');

export default states;
