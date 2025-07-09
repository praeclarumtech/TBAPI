import User from '../models/userModel.js';
import otpModel from '../models/otpModel.js'

export const getUser = async (body) => {
  return await User.findOne({ ...body, isDeleted: false });
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

export const updateProfileById = async (id, updateData) => {
  return User.updateOne({ _id: id }, updateData);
};

export const updateUserById = async (email, updateData) => {
  return User.updateOne({ email: email }, updateData);
};

export const findUserEmail = async ({ email }) => {
  return await User.findOne({ email });
};
export const findEmailForOtp = async ({ email }) => {
  return await otpModel.findOne({ email });
};

export const storeOtp = async (email, newOtp, expireOtp) => {
  return await otpModel.findOneAndUpdate(
    { email: email },
    { otp: newOtp, expirationIn: expireOtp },
    { upsert: true, }
  )
}