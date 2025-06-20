import mongoose from 'mongoose';

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
  }],
 
}, { 
  timestamps: true,
});

const jobApplication = mongoose.model('jobApplication', jobApplicationSchema);
export default jobApplication;