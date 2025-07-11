import mongoose from 'mongoose';
import { CompanyTypeEnum, HireResourcesEnum } from '../utils/enum.js';

const vendorSchema = new mongoose.Schema(
  {
    // Vendor Personal Details
    whatsapp_number: {
      type: String,
      required: false,
      match: [/^\d{10}$/, 'Invalid WhatsApp number'],
    },
    vendor_linkedin_profile: {
      type: String,
      required: false,
    },

    //Company Details
    company_name: {
      type: String,
      required: false,
    },
    company_email: {
      type: String,
      required: false,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Invalid company email'],
    },
    company_phone_number: {
      type: String,
      required: false,
      match: [/^\d{10}$/, 'Invalid company contact number'],
    },
    company_location: {
      type: String,
      required: false,
    },
    company_type: {
      type: String,
      enum: Object.values(CompanyTypeEnum),
      default: 'both',
    },
    hire_resources: {
      type: String,
      enum: Object.values(HireResourcesEnum),
      default: 'all',
    },
    company_strength: {
      type: String,
      required: false,
    },
    company_time: {
      type: String,
      required: false,
    },
    company_linkedin_profile: {
      type: String,
      required: false,
    },
    company_website: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Vendor = mongoose.model('Vendor', vendorSchema, 'vendor');

export default Vendor;
