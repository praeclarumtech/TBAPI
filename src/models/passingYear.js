import mongoose from 'mongoose';

const passingYearSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      unique: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const PassingYear = mongoose.model('PassingYear', passingYearSchema);
export default PassingYear;
