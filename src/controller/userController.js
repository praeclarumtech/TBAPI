import { Message } from '../utils/constant/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';
dotenv.config();
import{
  createUser,
  getUser,
  getAllusers,
  getUserById,
  updateUserById,
  findUserEmail,
  findEmailForOtp,
  deleteOtp,
  storeOtp
} from '../services/userService.js';
import { HandleResponse } from "../helpers/handleResponse.js";

export const register = async (req, res, next) => {
  let { userName, email, password, confirmPassword, role } = req.body;
  try {
    const existingUser = await getUser({ email });

    if (existingUser) {
      logger.warn(Message.USER_ALREADY_EXISTS);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_ALREADY_EXISTS
      );
    }

    
    await createUser({ userName, email, password, confirmPassword, role });

    logger.info(Message.REGISTERED_SUCCESSFULLY);
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.REGISTERED_SUCCESSFULLY,
    );
  } catch (error) {
    logger.error(`${Message.REGISTRATION_ERROR}: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} register.`
    );
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUser({ email });
    if (!user) {
      logger.info(Message.USER_NOT_FOUND);

      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.info(Message.INVALID_CREDENTIALS);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.INVALID_CREDENTIALS
      );
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    logger.info(Message.USER_LOGGED_IN_SUCCESSFULLY);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.USER_LOGGED_IN_SUCCESSFULLY,
      token
    );

  } catch (error) {
    logger.error(Message.SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} login.`
    );
  }
};

export const viewProfile = async (req, res) => {
  try {
    const user = await getAllusers();
    if (!user) {
      logger.warn(Message.USER_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }

    logger.info(Message.VIEW_ALL_PROFILE)
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.VIEW_ALL_PROFILE,
      user
    );
  } catch (error) {
    logger.error(Message.SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} View profile.`
    );
  }
};

export const viewProfileById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) {
      logger.warn(`${Message.USER_NOT_FOUND}: ${userId}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }
    
    logger.info(Message.VIEW_SINGLE_PROFILE)
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.VIEW_SINGLE_PROFILE,
      user
    );
  } catch (error) {
    logger.error(Message.SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} View prfofile by Id.`
    );
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
      logger.warn(Message.UNABLE_UP_USER);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.UNABLE_UP_USER,
      );
    }

    logger.info(`${Message.PROFILE_UPDATED_SUCCESSFULLY}: ${userId}`);
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.PROFILE_UPDATED_SUCCESSFULLY,
      updatedUser
    );
  
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update profile.`
    );
  }
};

export const sendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserEmail({ email });
    if (!user) {
      logger.warn(Message.USER_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    const expireOtp = new Date(Date.now() + 2 * 60 * 1000);

    logger.info(`${Message.OTP_SEND} OTP IS:- ${newOtp}`)
    
    const data = await sendingEmail({ email, otp: newOtp});
    if (!data) {
      logger.warn(Message.UNABLE_SENT_MAIL);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.UNABLE_SENT_MAIL,
      );
    }
    await storeOtp(email,newOtp,expireOtp) 
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        Message.MAIL_SENT,
        `OTP:-${newOtp}, will be expire in:${expireOtp}`,
      );
    } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} send mail.`
    );
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await findEmailForOtp({ email });
    if (!user) {
      logger.warn(Message.USER_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }


    if (user.otp !== otp) {
      logger.warn(Message.OTP_NOT_MATCHED);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OTP_NOT_MATCHED
      );
    }

    logger.info(Message.OTP_MATCHED);
    
    await deleteOtp({otp});
    
   return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.OTP_MATCHED,
    );
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.SERVER_ERROR,
      `${Message.FAILED_TO} verify otp.`
    );
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await getUserById(userId);
    if (!user) {
      logger.warn(Message.USER_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }

    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
    logger.warn(Message.PASSWORD_MISMATCH)
     return HandleResponse(
      res,
      false,
      StatusCodes.BAD_REQUEST,
      Message.PASSWORD_MISMATCH
     )
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserById(userId, { password: hashedPassword });

    logger.info(`${Message.PASS_UPDATED}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.PASS_UPDATED
     )
  } catch (error) {
    logger.error(`${Message.SERVER_ERROR}: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} updated passoword.`
    );
  }
}

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword} = req.body;

    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      logger.error(Message.USER_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.USER_NOT_FOUND
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn(Message.OLD_PASSWORD_INCORRECT);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OLD_PASSWORD_INCORRECT
      );
    }
    user.password = await newPassword;
    await user.save();

    logger.info(Message.PASSWORD_CHANGE_SUCCESSFULLY);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.PASSWORD_CHANGE_SUCCESSFULLY
    )
  } catch (error) {
    logger.error(Message.SERVER_ERROR, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} change password.`
    )
  }
}
