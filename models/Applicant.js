

const mongoose = require("mongoose");

const ApplicantSchema = new mongoose.Schema({
  application_No: { type: Number, unique: true },
  name: {
    first: { type: String, required: true },
    middle: { type: String },
    last: { type: String, required: true },
  },
  phone: {
    whatsApp: { type: String, required: true },
    contact: { type: String, required: true },
  },
  email: { type: String, required: true, unique: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  dob: { type: Date, required: true },
  qualification: { type: String },
  degree: { type: String },
  passing_Year: { type: Number },
  current_Location: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: Number },
  city: { type: String },
  applied_Skills: { type: [String] },
  resume: { type: String },
  total_Exp: { type: Number },
  relevant_Exp: { type: Number },
  other_Skills: { type: String },
  javascript_Rate: { type: Number },
  current_Pkg: { type: String },
  expected_Pkg: { type: String },
  notice_Period: { type: String },
  negotiationable: { type: String },
  ready_Wfo: { type: String, enum: ["Yes", "No"] },
  work_Preference: { type: String, enum: ["Remote", "Hybrid", "Onsite"] },
  about_Us: { type: String },
  feedback: { type: String },
  status: { type: String, enum: ["Pending", "Selected", "Rejected","On-Hold","In-Process"],default:"Pending" },
  interview_Stage: { type: String, enum: ["HR", "Technical", "1st Interview", "Final","2nd Interview"],default:"HR" },
  referal: { type: String },
  created_At: { type: Date, default: Date.now },
  modified_At: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Applicant", ApplicantSchema);
