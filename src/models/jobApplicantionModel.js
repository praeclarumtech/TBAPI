import mongoose from 'mongoose';
import { applicationsEnum } from '../utils/enum.js';

const jobApplicationSchema = new mongoose.Schema({
  applicant_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true
  },
  applications: [{
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',  // Reference to Job model if you have one
      required: true
    },
    applied_Date: {
      type: Date,
      default: Date.now
    },
    score: { type: Number, required: true },
    status: {
      type: String,
      enum: [applicationsEnum.SUBMITTED, applicationsEnum.INTERVIEW],
      default: applicationsEnum.SUBMITTED
    }
  }],
   user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: false,
      }
}, { 
  timestamps: true,
});

const jobApplication = mongoose.model('jobApplication', jobApplicationSchema);
export default jobApplication;