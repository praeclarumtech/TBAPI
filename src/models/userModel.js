import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// import { Enum } from '../utils/enum.js';

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
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
    role: { type: String, required: false }, // Role string
    roleId: {
      // Role ObjectId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
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
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    vendorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: false,
    },
    addedByRole: {
      type: String,
      required: false,
    },
    passwordChanged: {
      type: Boolean,
      default: true, // Default to true for existing users, false for users with temp passwords
    },
    // User address fields
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
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

// Create unique index for userName to prevent duplicates at database level
userSchema.index({ userName: 1 }, { unique: true });

const User = mongoose.model('user', userSchema);
export default User;
