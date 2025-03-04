import mongoose from 'mongoose';

const sendingOtpSchema = new mongoose.Schema(
  {
    email:{
      type:String,
      required:true
    },
    otp: {
      type: String,
      required:true
    },
    resetOtp: {
      type: Date,
      default:Date.now,
      expires:120
    }
  },
);

const sendingOtp = mongoose.model('sendingOtp', sendingOtpSchema);
export default sendingOtp;
