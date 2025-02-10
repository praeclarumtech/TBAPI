import { Message } from "../utils/message.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../loggers/logger.js";
import {
  createUser,
  getUser,
  getAllusers,
  getUserById,
  updateUserById,
} from "../services/user.service.js";

export const register = async (req, res, next) => {
  let { userName, email, password, role } = req.body;
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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    logger.info(Message.PASSWORD_CHANGE_SUCCESSFULLY);
    res.json({ message: Message.PASSWORD_CHANGE_SUCCESSFULLY });
  } catch (error) {
    logger.error(Message.SERVER_ERROR, error);
    res.status(500).json({ message: Message.SERVER_ERROR });
  }
};
