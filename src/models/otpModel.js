import mongoose from 'mongoose';

const sendingOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true
    },
    otp: {
      type: String,
      required: true
    },
    expirationIn: {
      type: Date,
    }
  },
  { timestamps: true }
);

const sendingOtp = mongoose.model('sendingOtp', sendingOtpSchema);
export default sendingOtp;
