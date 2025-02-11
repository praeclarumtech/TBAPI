import mongoose from "mongoose";
import { applicantEnum } from "../utils/enum.js";

const ApplicantSchema = new mongoose.Schema(
  {
    application_No: { type: Number, required: true },
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
    passing_Year: { type: Number, required: true },
    current_Location: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true },
    city: { type: String, required: true },
    applied_Skills: { type: [String], required: true },
    resume: { type: String, required: true },
    total_Exp: { type: Number, required: true },
    relevant_Exp: { type: Number, required: true },
    other_Skills: { type: String }, //*********** */
    javascript_Rate: { type: Number, required: true },
    current_Pkg: { type: String },
    expected_Pkg: { type: String },
    notice_Period: { type: String },
    negotiable: { type: String },
    ready_Wfo: {
      type: String,
      enum: [applicantEnum.YES, applicantEnum.NO],
      required: true,
    },
    work_Preference: {
      type: String,
      enum: [applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE],
      required: true,
    },
    about_Us: { type: String },
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
    interview_Stage: {
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
    referral: { type: String }
  },
  { timestamps: true }
);

const Applicant = mongoose.model("Applicant", ApplicantSchema);
export default Applicant;
