import mongoose from 'mongoose';
import { applicantEnum } from '../utils/enum.js';

const ApplicantSchema = new mongoose.Schema(
  {
    applicationNo: { type: Number, required: true },
    name: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String, required: true },
    },
    phone: {
      whatsappNumber: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    email: { type: String, required: true },
    gender: {
      type: String,
      enum: [applicantEnum.MALE, applicantEnum.FEMALE, applicantEnum.OTHER],
      required: true,
    },
    dateOfBirth: { type: Date, required: true },
    qualification: { type: String, required: true },
    degree: { type: String, required: true },
    passingYear: { type: Number, required: true },
    fullAddress: { type: String, required: true },
    currentLocation: { type: String },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true },
    city: { type: String, required: true },
    appliedSkills: { type: [String], required: true },
    resume: { type: String, required: false },
    totalExperience: { type: Number, required: true },
    relevantSkillExperience: { type: Number, required: true },
    otherSkills: { type: String }, //*********** */
    rating: { type: Number, required: true },
    currentPkg: { type: String },
    expectedPkg: { type: String },
    noticePeriod: { type: String },
    negotiation: { type: String },
    readyForWork: {
      type: String,
      enum: [applicantEnum.YES, applicantEnum.NO],
      required: true,
    },
    workPreference: {
      type: String,
      enum: [applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE],
      required: true,
    },
    aboutUs: { type: String },
    feedback: { type: String },
    status: {
      type: String,
      enum: [
        applicantEnum.PENDING,
        applicantEnum.SELECTED,
        applicantEnum.REJECTED,
        applicantEnum.HOLD,
        applicantEnum.IN_PROCESS,
      ],
      default: applicantEnum.PENDING,
      required: false,
    },
    interviewStage: {
      type: String,
      enum: [
        applicantEnum.HR_ROUND,
        applicantEnum.TECHNICAL,
        applicantEnum.FIRST_INTERVIEW,
        applicantEnum.FINAL,
        applicantEnum.SECOND_INTERVIEW,
      ],
      default: applicantEnum.HR_ROUND,
      required: false,
    },
    referral: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Applicant = mongoose.model('Applicant', ApplicantSchema);
export default Applicant;
