import mongoose from 'mongoose';

// Email template visibility schema for each template
const templateVisibilitySchema = new mongoose.Schema(
  {
    templateType: {
      type: String,
      required: true,
    },
    vendor: {
      type: Boolean,
      default: false,
    },
    client: {
      type: Boolean,
      default: false,
    },
    job: {
      type: Boolean,
      default: false,
    },
    qrCode: {
      type: Boolean,
      default: false,
    },
    custom: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    // Date & Time Settings
    dateFormat: {
      type: String,
      enum: [
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'YYYY-MM-DD',
        'DD-MM-YYYY',
        'YYYY/MM/DD',
      ],
      default: 'DD/MM/YYYY',
    },
    timeFormat: {
      type: String,
      enum: ['12', '24'],
      default: '12',
    },
    timezone: {
      type: String,
      enum: [
        'IST',
        'UTC',
        'EST',
        'PST',
        'CST',
        'MST',
        'GMT',
        'CET',
        'EET',
        'JST',
        'AEST',
      ],
      default: 'IST',
    },

    // Email Template Visibility Settings
    emailTemplateVisibility: [templateVisibilitySchema],

    // Track who created/updated
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

const Settings = mongoose.model('Settings', settingsSchema, 'settings');
export default Settings;
