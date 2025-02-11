import { Message } from "../utils/message.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../loggers/logger.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import User from "../models/user.model.js";
dotenv.config();
import {
  createUser,
  getUser,
  getAllusers,
  getUserById,
  updateUserById,
} from "../services/user.service.js";

export const register = async (req, res, next) => {
  let { userName, email, password, confirmPassword, role } = req.body;
  try {
    const existingUser = await getUser({ email });
    if (existingUser) {
      logger.warn(`${Message.USER_ALREADY_EXISTS}: ${email}`);
      return res
        .status(409)
        .json({ success: true, message: Message.ALREADY_EXIST });
    }
    await createUser({ userName, email, password, role });

    logger.info(Message.REGISTERED_SUCCESSFULLY);
    return res
      .status(201)
      .json({ success: true, message: Message.REGISTERED_SUCCESSFULLY });
  } catch (error) {
    logger.error(`${Message.REGISTRATION_ERROR}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ error: Message.REGISTRATION_ERROR });
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
        .json({ success: true, message: Message.USER_NOT_FOUND });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.info(`${Message.INVALID_CREDENTIALS}: ${email}`);
      return res.status(400).json({ message: Message.INVALID_CREDENTIALS });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );
    logger.info(` ${Message.USER_LOGGED_IN_SUCCESSFULLY}: ${email}`);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: Message.USER_NOT_FOUND,
      });
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    const expireOtp = new Date(Date.now() + 5 * 60 * 1000);
    user.otp = newOtp;
    user.resetOtp = expireOtp;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: 2525,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    // config useail
    const mailOption = {
      from: process.env.FROM,
      to: user.email,
      subject: "first mail",
      text: `new otp:-${newOtp}`,
    };

    try {
      await transporter.sendMail(mailOption);
      console.log("mail sent succesfull");
      return res.status(200).json({
        success: true,
        message: Message.MAIL_SENT,
        data: mailOption,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: Message.SERVER_ERROR,
        error: error.message,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: Message.SERVER_ERROR,
        error: error.message,
      });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email,otp } = req.body;
    const user = await confirmOtp({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: Message.USER_NOT_FOUND });
    }
    if (user.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: Message.OTP_NOT_MATCHED });
    }
    return res
      .status(200)
      .json({ success: true, message: Message.OTP_MATCHED });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: Message.SERVER_ERROR,
        error: error.message,
      });
  }
};

export const forgtoPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword, confirmPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: Message.USER_NOT_FOUND });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "password must be same" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "password updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: Message.SERVER_ERROR,
        error: error.message,
      });
  }
};
