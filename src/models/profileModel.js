import mongoose from 'mongoose';
import { Enum } from '../utils/enum';

const ProfileSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{3}-\d{3}-\d{4}$/, 'Invalid phone number format (XXX-XXX-XXXX)']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: [Enum.MALE,Enum.FEMALE,Enum.OTHER]
  },
  profilePicture: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Profile', ProfileSchema);
