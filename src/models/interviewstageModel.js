import mongoose from 'mongoose';

const interviewstageSchema = new mongoose.Schema(
  {
    stage: {
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

const interviewStage = mongoose.model('interviewStage', interviewstageSchema);
export default interviewStage;
