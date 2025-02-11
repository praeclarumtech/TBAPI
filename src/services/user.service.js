import User from '../models/user.model.js';

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

export const confirmOtp = async()=>{
  return User.findOne
}
