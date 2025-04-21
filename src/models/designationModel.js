import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    designation: {
      type: String,
      unique: true,
      required: true,
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

const designations = mongoose.model('designation', designationSchema);
export default designations;
