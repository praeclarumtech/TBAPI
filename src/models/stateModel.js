import mongoose from 'mongoose';
import { stateEnum } from '../utils/enum.js';

const stateSchema = new mongoose.Schema(
  {
    state_name : {
      type: String,
      enum: Object.values(stateEnum),
      required: true,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'country',
      required: true
    }
  }
);

const states = mongoose.model('state', stateSchema, 'state');

export default states;