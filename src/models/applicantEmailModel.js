import mongoose from 'mongoose';

const applicantEmailSchema = new mongoose.Schema(
  {
    email_to: {
      type: [String], 
      required: true,
    },
    email_bcc: {
      type: [String],
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    attachments: [
      {
        filename: { type: String },
        path: { type: String },
      }
    ],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const applicantEmail = mongoose.model('applicantEmail', applicantEmailSchema, 'applicant_email');

export default applicantEmail;
