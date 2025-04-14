import mongoose from 'mongoose';
import { candidateTemplateType } from '../utils/enum.js';
 
const emailTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(candidateTemplateType),
      unique: true,
      required: true
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);
 
const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema, 'email_templates');
export default EmailTemplate;