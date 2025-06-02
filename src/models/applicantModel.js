import mongoose from 'mongoose';
import { applicantEnum, genderEnum, Enum } from '../utils/enum.js';

const ApplicantSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: false,
    },
    name: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String, required: false },
    },
    phone: {
      whatsappNumber: { type: String, unique: true },
      phoneNumber: { type: String, required: true, unique: true },
    },
    email: { type: String, required: true, unique: true },
    gender: {
      type: String,
      enum: [genderEnum.MALE, genderEnum.FEMALE, genderEnum.OTHER, ''],
      required: false,
    },
    dateOfBirth: { type: Date, required: false },
    qualification: { type: String, required: false },
    specialization: { type: String, required: false },
    passingYear: { type: Number, required: false },
    currentAddress: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String },
    currentPincode: { type: Number, required: false },
    currentCity: { type: String, required: false },
    appliedSkills: { type: [String], required: false },
    anyHandOnOffers: { type: Boolean, default: false },
    resume: { type: String, required: false },
    totalExperience: { type: Number },
    relevantSkillExperience: { type: Number, required: false },
    communicationSkill: { type: Number, required: false },
    otherSkills: { type: String },
    rating: { type: Number, required: false },
    currentPkg: { type: Number },
    expectedPkg: { type: Number },
    noticePeriod: { type: Number },
    negotiation: { type: String, required: false },
    workPreference: {
      type: String,
      enum: [applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE, ''],
      required: false,
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
        applicantEnum.HR_ROUND,
        applicantEnum.TECHNICAL,
        applicantEnum.FIRST_INTERVIEW_ROUND,
        applicantEnum.PRACTICAL,
        applicantEnum.CLIENT,
      ],
      default: applicantEnum.FIRST_INTERVIEW_ROUND,
      required: false,
    },
    currentCompanyDesignation: {
      type: String,
      required: false
    },
    appliedRole: {
      type: String, required: false,
    },
    practicalUrl: { type: String },
    practicalFeedback: { type: String },
    portfolioUrl: { type: String },
    referral: { type: String },
    resumeUrl: { type: String, required: false },
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
    permanentAddress: { type: String, required: false },
    collegeName: { type: String },
    cgpa: { type: Number },
    linkedinUrl: { type: String },
    clientCvUrl: { type: String },
    clientFeedback: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    createdBy: {
      type: String,
      enum: [Enum.ADMIN, Enum.HR, Enum.USER],
    },
    updatedBy: {
      type: String,
      enum: [Enum.ADMIN, Enum.HR, Enum.USER]
    },
    addedBy: {
      type: String,
      enum: [applicantEnum.MANUAL, applicantEnum.CSV, applicantEnum.RESUME],
      required: true
    },
    meta: {
      type: Object,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
    },
  },
  { timestamps: true }
);

const Applicant = mongoose.model('Applicant', ApplicantSchema);
export default Applicant;
