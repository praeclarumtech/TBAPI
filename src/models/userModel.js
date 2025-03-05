import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Enum } from '../utils/enum.js';
import { genderEnum } from '../utils/enum.js';

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [Enum.ADMIN, Enum.HR, Enum.USER],
    default: Enum.ADMIN,
  },
  phoneNumber: {
    type: Number,
    match: [/^\d{3}-\d{3}-\d{4}$/, 'Invalid phone number format (XXX-XXX-XXXX)']
  },
  profilePicture: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: [genderEnum.MALE, genderEnum.FEMALE, genderEnum.OTHER]
  },
  designation: {
    type: String
  },

}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('user', userSchema);
export default User;
