import User from "../models/user.model.js";
import { Message } from "../utils/message.js";
import bcrypt from 'bcryptjs'
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
    "-password"
  );
};

export const findUserEmail = async ({email}) => {
  return User.findOne({ email });
};

export const verifyOtpService = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) {
    return { success: false, status: 404, message: Message.USER_NOT_FOUND };
  }

  if (user.otp !== otp) {
    return { success: false, status: 400, message: Message.OTP_NOT_MATCHED };
  }

  return { success: true, status: 200, message: Message.OTP_MATCHED };
};

export const updatePasswordService = async (
  userId,
  newPassword,
  confirmPassword
) => {
  if (newPassword !== confirmPassword) {
    return { success: false, status: 400, message: "Passwords must be the same" };
  }
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, status: 404,message:Message.USER_NOT_FOUND };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();
  return { success: true, status: 200, message: "Password updated successfully" };
};
