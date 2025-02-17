import { Message } from '../utils/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import dotenv from 'dotenv';
import { sendingEmail } from '../helpers/commonFunction/sendEmail.js';
dotenv.config();
import {
  createUser,
  getUser,
  getAllusers,
  getUserById,
  updateUserById,
  findUserEmail,
} from '../services/userService.js';

export const register = async (req, res, next) => {
  let { userName, email, password, confirmPassword, role } = req.body;
  try {
    const existingUser = await getUser({ email });

    if (existingUser) {
      logger.warn(`${Message.USER_ALREADY_EXISTS}: ${email}`);
      return res
        .status(409)
        .json({ success: false, message: Message.ALREADY_EXIST });
    }
    await createUser({ userName, email, password, confirmPassword, role });

    logger.info(Message.REGISTERED_SUCCESSFULLY);
    return res
      .status(201)
      .json({ success: true, message: Message.REGISTERED_SUCCESSFULLY });
  } catch (error) {
    logger.error(`${Message.REGISTRATION_ERROR}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: Message.REGISTRATION_ERROR }); // Fixed success flag
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUser({ email });

    if (!user) {
      logger.info(`${Message.USER_NOT_FOUND}: ${email}`);
      return res
        .status(400)
        .json({ success: false, message: Message.USER_NOT_FOUND });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.info(`${Message.INVALID_CREDENTIALS}: ${email}`);
      return res
        .status(400)
        .json({ success: false, message: Message.INVALID_CREDENTIALS }); // Fixed success flag
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    logger.info(`${Message.USER_LOGGED_IN_SUCCESSFULLY}: ${email}`);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: Message.USER_LOGGED_IN_SUCCESSFULLY,
      data: token,
    });
  } catch (error) {
    logger.error(`${Message.LOGIN_ERROR}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: Message.LOGIN_ERROR });
  }
};

export const viewProfile = async (req, res) => {
  try {
    const user = await getAllusers();
    if (!user) {
      logger.warn(Message.USER_NOT_FOUND);
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export const viewProfileById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) {
      logger.warn(`${Message.USER_NOT_FOUND}: ${userId}`);
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userName, email, phoneNumber, dateOfBirth, gender, designation } =
      req.body;

    let updateData = {
      userName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      designation,
    };

    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    const updatedUser = await updateUserById(userId, updateData);

    if (!updatedUser) {
      logger.warn(`${Message.USER_NOT_FOUND}: ${userId}`);
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }

    logger.info(`${Message.PROFILE_UPDATED_SUCCESSFULLY}: ${userId}`);
    res.status(202).json({
      message: Message.PROFILE_UPDATED_SUCCESSFULLY,
      user: updatedUser,
    });
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    res
      .status(500)
      .json({ message: Message.SERVER_ERROR, error: error.message });
  }
};

export const sendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserEmail({ email });
    if (!user) {
      logger.warn(Message.USER_NOT_FOUND);
      return res.status(200).json({
        success: false,
        statusCode: 404,
        message: Message.USER_NOT_FOUND,
      });
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    const expireOtp = new Date(Date.now() + 5 * 60 * 1000);
    user.otp = newOtp;
    user.resetOtp = expireOtp;
    await user.save();

    const data = await sendingEmail({ email, otp: newOtp });
    if (!data) {
      logger.warn(Message.SERVER_ERROR);
      res.status(500).json({
        success: false,
        message: Message.SERVER_ERROR,
        error: error.message,
      });
    }

    logger.info(Message.MAIL_SENT);
    res
      .status(200)
      .json({ success: true, message: Message.MAIL_SENT, data: newOtp });
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: Message.SERVER_ERROR,
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await findUserEmail({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: Message.USER_NOT_FOUND });
    }

    if (user.otp !== otp) {
      logger.warn(Message.OTP_NOT_MATCHED);
      return res
        .status(404)
        .json({ success: false, message: Message.OTP_NOT_MATCHED });
    }

    logger.info(Message.OTP_MATCHED);
    return res.status(200).json({
      success: true,
      message: Message.OTP_MATCHED,
    });
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: Message.SERVER_ERROR,
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await getUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: Message.USER_NOT_FOUND });
    }

    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: Message.PASS_NOT_MATCHED });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserById(userId, { password: hashedPassword });

    logger.info(`${Message.PASS_UPDATED}`);
    return res
      .status(200)
      .json({ success: true, message: Message.PASS_UPDATED });
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: Message.SERVER_ERROR,
      error: error.message,
    });
  }}

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      logger.error(Message.USER_NOT_FOUND);
      return res.status(404).json({ message: Message.USER_NOT_FOUND });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn(Message.OLD_PASSWORD_INCORRECT);
      return res.status(400).json({ message: Message.OLD_PASSWORD_INCORRECT });
    }

    user.password = await newPassword;
    await user.save();

    logger.info(Message.PASSWORD_CHANGE_SUCCESSFULLY);
    res.json({ message: Message.PASSWORD_CHANGE_SUCCESSFULLY });
  } catch (error) {
    logger.error(Message.SERVER_ERROR, error);
    res.status(500).json({ message: Message.SERVER_ERROR });
  }
}
