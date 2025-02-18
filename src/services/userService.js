import User from '../models/userModel.js';
import otpModel from '../models/otp.model.js'
export const getUser = async (body) => {
  return User.findOne({ ...body });
};

export const createUser = async (body) => {
  const user = new User({ ...body });
  await user.save();
};

export const getAllusers = async () => {
  return User.find();
};

export const getUserById = async (id) => {
  return User.findById(id);
};

export const updateUserById = async (id, updateData) => {
  return User.findByIdAndUpdate(id, updateData, { new: true }).select(
    '-password'
  );
};

export const findUserEmail = async ({ email }) => {
  return User.findOne({ email });
};
export const findEmailForOtp = async ({ email }) => {
  return otpModel.findOne({ email });
};

export const deleteOtp = async({otp})=>{
  return  otpModel.deleteOne({otp});
}

export const storeOtp = async(email,newOtp,expireOtp)=>{
  return otpModel.findOneAndUpdate(
    {email:email},
    {otp:newOtp,resetOtp:expireOtp},
    {upsert:true,}
)
}