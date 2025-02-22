import mongoose from 'mongoose';

const applicantEmailSchema = new mongoose.Schema(
  {
    email_to: {
      type: String,
      required: true,
    },
    email_bcc: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
        type: String,
    },
    date:{
        type:Date,
        default:Date.now
    },
  },
);

const applicantEmail = mongoose.model('applicantEmail', applicantEmailSchema, 'applicant_email');

export default applicantEmail;
