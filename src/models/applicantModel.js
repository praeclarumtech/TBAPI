import mongoose from 'mongoose';
import { applicantEnum } from '../utils/enum.js';

const ApplicantSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
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
    specialization: { type: String, required: true },
    passingYear: { type: Number, required: true },

    currentAddress: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    currentPincode: { type: Number, required: false },
    currentCity: { type: String, required: false },
    appliedSkills: { type: [String], required: true },
    anyHandOnOffers: { type: Boolean, default: false },
    resume: { type: String, required: false },
    totalExperience: { type: Number, required: false },
    relevantSkillExperience: { type: Number, required: false },
    communicationSkill: { type: Number, required: true },
    otherSkills: { type: String },
    rating: { type: Number, required: true },
    currentPkg: { type: String },
    expectedPkg: { type: Number },
    noticePeriod: { type: Number },
    negotiation: { type: String, required: true },
    workPreference: {
      type: String,
      enum: [applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE],
      required: true,
    },
    comment: { type: String },
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
        applicantEnum.HR_ROUND,//** */
        applicantEnum.TECHNICAL,//** */
        applicantEnum.FIRST_INTERVIEW,
        applicantEnum.FINAL,//** */
        applicantEnum.SECOND_INTERVIEW,
      ],
      default: applicantEnum.HR_ROUND,
      required: false,
    },
    currentCompanyDesignation: {
      type: String,
      enum: [
        applicantEnum.FRONTED_DEVLOPER,
        applicantEnum.SOFTWARE_ENGINNER,
        applicantEnum.BACKEND_DEVLOPER,
        applicantEnum.FULL_STACK_DEVLOPER,
        applicantEnum.DATA_ANALYST,
        applicantEnum.DATA_SCIENTIST,
        applicantEnum.PRODUCT_MANAGER,
        applicantEnum.UI_UX,
        applicantEnum.QA,
        applicantEnum.DEVOPS,
        applicantEnum.BUSNESS_ANALYST,
        applicantEnum.TECHNICSL_SUPPORT,
        applicantEnum.OTHER,
        applicantEnum.NA,
      ],
      required: false
    },
    appliedRole: {
      type: String, required: true,
      enum: [
        applicantEnum.FRONTED_DEVLOPER,
        applicantEnum.SOFTWARE_ENGINNER,
        applicantEnum.BACKEND_DEVLOPER,
        applicantEnum.FULL_STACK_DEVLOPER,
        applicantEnum.DATA_ANALYST,
        applicantEnum.DATA_SCIENTIST,
        applicantEnum.PRODUCT_MANAGER,
        applicantEnum.UI_UX,
        applicantEnum.QA,
        applicantEnum.DEVOPS,
        applicantEnum.BUSNESS_ANALYST,
        applicantEnum.TECHNICSL_SUPPORT,
        applicantEnum.OTHER,
        applicantEnum.NA,
      ],
    },
    practicalUrl: { type: String },
    practicalFeedback: { type: String },
    portfolioUrl: { type: String },
    referral: { type: String },
    resumeUrl: { type: String },
    preferredLocations: { type: String, },
    currentCompanyName: { type: String, },
    maritalStatus: {
      type: String,
      enum: [
        applicantEnum.SINGLE,
        applicantEnum.MARRIED,
        '',
      ],
    },
    lastFollowUpDate: { type: Date },
    permanentAddress: { type: String, required: true },
    cgpa: { type: Number},
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Applicant = mongoose.model('Applicant', ApplicantSchema);
export default Applicant;
