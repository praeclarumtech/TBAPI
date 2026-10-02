import mongoose from 'mongoose';
import {
  genderEnum,
  trainingApplicantTypeEnum,
  trainingDurationValues,
  trainingSemesterValues,
} from '../utils/enum.js';

const TrainingApplicationSchema = new mongoose.Schema(
  {
    name: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true, default: '' },
      lastName: { type: String, required: true, trim: true },
    },
    countryCode: { type: String, default: '+91', trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    technology: { type: [String], default: [] },
    collegeName: { type: String, trim: true, default: '' },
    semester: {
      type: String,
      enum: [...trainingSemesterValues, ''],
      default: '',
    },
    duration: {
      type: String,
      enum: trainingDurationValues,
      required: true,
    },
    gender: {
      type: String,
      enum: [genderEnum.MALE, genderEnum.FEMALE, genderEnum.OTHER],
      required: true,
    },
    applicantType: {
      type: String,
      enum: Object.values(trainingApplicantTypeEnum),
      required: true,
    },
    state: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TrainingApplicationSchema.index({ createdAt: -1 });
TrainingApplicationSchema.index({ isDeleted: 1, createdAt: -1 });
TrainingApplicationSchema.index({ phone: 1, email: 1, isDeleted: 1 });

const TrainingApplication = mongoose.model(
  'TrainingApplication',
  TrainingApplicationSchema
);

export default TrainingApplication;
