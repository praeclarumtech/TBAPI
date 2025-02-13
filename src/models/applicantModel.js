import mongoose from "mongoose";
import { applicantEnum } from "../utils/enum.js";

const ApplicantSchema = new mongoose.Schema(
  {
    applicationNo: { type: Number, required: true },
    name: {
      first: { type: String, required: true },
      middle: { type: String },
      last: { type: String, required: true },
    },
    phone: {
      whatsApp: { type: String, required: true },
      contact: { type: String, required: true },
    },
    email: { type: String, required: true },
    gender: {
      type: String,
      enum: [applicantEnum.MALE, applicantEnum.FEMALE, applicantEnum.OTHER],
      required: true,
    },
    dob: { type: Date, required: true },
    qualification: { type: String, required: true },
    degree: { type: String, required: true },
    passingYear: { type: Number, required: true },
    currentLocation: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true },
    city: { type: String, required: true },
    appliedSkills: { type: [String], required: true },
    resume: { type: String, required: true },
    totalExp: { type: Number, required: true },
    relevantExp: { type: Number, required: true },
    otherSkills: { type: String }, //*********** */
    javascriptRate: { type: Number, required: true },
    currentPkg: { type: String },
    expectedPkg: { type: String },
    noticePeriod: { type: String },
    negotiable: { type: String },
    readyWfo: {
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
        applicantEnum.ON_HOLD,
        applicantEnum.IN_PROCESS,
      ],
      default: applicantEnum.PENDING,
      required: true,
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
      required: true,
    },
    referral: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Applicant = mongoose.model("Applicant", ApplicantSchema);
export default Applicant;
