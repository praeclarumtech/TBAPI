import mongoose from 'mongoose';

const applicantStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      unique: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const applicantStatus = mongoose.model(
  'applicantStatus',
  applicantStatusSchema
);
export default applicantStatus;
