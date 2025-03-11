import User from '../models/userModel.js';
import otpModel from '../models/otpModel.js'

export const getUser = async (body) => {
  return await User.findOne({ ...body });
};

export const createUser = async (body) => {
  const user = new User({ ...body });
  return await user.save();
};

export const getAllusers = async () => {
  return await User.find();
};

export const getUserById = async (id) => {
  return await User.findById(id);
};

export const updateUserById = async (id, updateData) => {
  return User.updateOne({ _id: id }, updateData);
};

export const findUserEmail = async ({ email }) => {
  return await User.findOne({ email });
};
export const findEmailForOtp = async ({ email }) => {
  return await otpModel.findOne({ email });
};

export const deleteOtp = async ({ otp }) => {
  return await otpModel.deleteOne({ otp });
}

export const storeOtp = async (email, newOtp, expireOtp) => {
  return await otpModel.findOneAndUpdate(
    { email: email },
    { otp: newOtp, resetOtp: expireOtp },
    { upsert: true, }
  )
}