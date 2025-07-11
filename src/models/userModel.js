import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Enum } from '../utils/enum.js';

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
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
      enum: [Enum.ADMIN, Enum.HR, Enum.USER, Enum.VENDOR, Enum.GUEST],
      default: Enum.ADMIN,
    },
    phoneNumber: {
      type: Number,
      match: [
        /^\d{3}-\d{3}-\d{4}$/,
        'Invalid phone number format (XXX-XXX-XXXX)',
      ],
    },
    profilePicture: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    designation: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    vendorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('user', userSchema);
export default User;
