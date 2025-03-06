import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema(
  {
    state_name : {
      type: String,
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