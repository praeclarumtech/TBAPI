import { Message } from '../utils/constant/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';
dotenv.config();
import {
  createUser,
  getUser,
  getAllusers,
  getUserById,
  updateUserById,
  updateProfileById,
  findUserEmail,
  findEmailForOtp,
  storeOtp,
} from '../services/userService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { upload } from '../helpers/multer.js';
import axios from 'axios';
import { Enum } from '../utils/enum.js';

export const register = async (req, res, next) => {
  let { userName, email, password, confirmPassword, role } = req.body;
  try {
    const existingUser = await getUser({ email });

    if (existingUser) {
      logger.warn(`User ${Message.ALREADY_EXIST}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `User ${Message.ALREADY_EXIST}`
      );
    }

    await createUser({ userName, email, password, confirmPassword, role });

    logger.info(Message.REGISTERED_SUCCESSFULLY);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      Message.REGISTERED_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} register.`);
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

    const isEmail = /\S+@\S+\.\S+/.test(email);
    const user = await getUser(isEmail ? { email } : { userName: email });

    if (!user) {
      logger.info(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
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
      { expiresIn: process.env.EXPIRES_IN }
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
    logger.error(`${Message.FAILED_TO} login.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} login.`
    );
  }
};

export const facebookLogin = async (req, res) => {
  const { accessToken, userID } = req.body;

  try {
    const fbGraphUrl = `https://graph.facebook.com/v18.0/${userID}?fields=id,name,email,picture&access_token=${accessToken}`;
    const { data } = await axios.get(fbGraphUrl);

    const { name, email, picture } = data;

    if (!email) {
      logger.warn(Message.FACEBOOK_ACC_DOES_NOT_RETURN_EMAIL);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.FACEBOOK_ACC_DOES_NOT_RETURN_EMAIL
      );
    }

    const existingUser = await getUser({ email });

    const user = existingUser
      ? existingUser
      : await createUser({
          userName: name,
          email,
          profilePicture: picture?.data?.url,
          role: Enum.GUEST,
        });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

    logger.info(Message.USER_LOGGED_IN_SUCCESSFULLY);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.USER_LOGGED_IN_SUCCESSFULLY,
      { token, user }
    );
  } catch (error) {
    logger.error(`Facebook ${Message.TOKEN_IS_NOT_VALID}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.UNAUTHORIZED,
      `Facebook ${Message.TOKEN_IS_NOT_VALID}`
    );
  }
};

export const linkedInLogin = async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      },
    });

    const accessToken = tokenRes.data.access_token;

    // Get user profile
    const [profileRes, emailRes] = await Promise.all([
      axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ]);

    const name = `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`;
    const email = emailRes.data.elements[0]['handle~'].emailAddress;

    if (!email) {
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, 'LinkedIn account does not return email');
    }

    const existingUser = await getUser({ email });

    const user = existingUser || await createUser({
      userName: name,
      email,
      role: Enum.GUEST,
      profilePicture: null,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

    return HandleResponse(res, true, StatusCodes.OK, 'Logged in with LinkedIn', { token, user });

  } catch (err) {
    return HandleResponse(res, false, StatusCodes.UNAUTHORIZED, `LinkedIn login failed: ${err.message}`);
  }
};

export const viewProfile = async (req, res) => {
  try {
    const user = await getAllusers();
    if (!user) {
      logger.warn(`Profile ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Profile ${Message.NOT_FOUND}`
      );
    }
    logger.info(`All profile are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All profile are ${Message.FETCH_SUCCESSFULLY}`,
      user
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view profile.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view profile.`
    );
  }
};

export const getProfileByToken = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getUserById(userId);
    if (!user) {
      logger.warn(`Profile ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Profile ${Message.NOT_FOUND}`
      );
    }

    logger.info(`User profile ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `User profile ${Message.FETCH_SUCCESSFULLY}`,
      user
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch user profile.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch user profile.`
    );
  }
};

export const viewProfileById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) {
      logger.warn(`Profile ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Profile ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Profile ${Message.FETCH_BY_ID}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Profile ${Message.FETCH_BY_ID}`,
      user
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} view prfofile by Id.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} view prfofile by Id.`
    );
  }
};

export const updateProfile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      logger.info(Message.INVALID_FILE_TYPE)
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, Message.INVALID_FILE_TYPE);
    }

    try {
      const userId = req.params.id;
      const {
        firstName,
        lastName,
        userName,
        email,
        phoneNumber,
        dateOfBirth,
        designation,
      } = req.body;

      let updateData = {
        firstName,
        lastName,
        userName,
        email,
        phoneNumber,
        dateOfBirth,
        designation,
      };

      if (req.file) {
        updateData.profilePicture = req.file.filename;
      }

      const updatedUser = await updateProfileById(userId, updateData);

      if (!updatedUser) {
        logger.warn(`Profile ${Message.NOT_FOUND}`);
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          `Profile ${Message.NOT_FOUND}`
        );
      }

      logger.info(`Profile ${Message.UPDATED_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `Profile ${Message.UPDATED_SUCCESSFULLY}`,
        updatedUser
      );
    } catch (error) {
      logger.error(`${Message.FAILED_TO} update profile.`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${Message.FAILED_TO} update profile.`
      );
    }
  });
};

export const sendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserEmail({ email });
    if (!user) {
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    const expireOtp = new Date(Date.now() + 2 * 60 * 1000);

    logger.info(`${Message.OTP_SEND} OTP IS:- ${newOtp}`);

    const data = await sendingEmail({ email, newOtp });
    if (!data) {
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `User ${Message.NOT_FOUND}`
      );
    }
    await storeOtp(email, newOtp, expireOtp);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      Message.MAIL_SENT,
      `OTP:-${newOtp}, will be expire in:${expireOtp}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} send mail.`);
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
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }
    if (new Date() > user.expirationIn) {
      logger.warn(Message.OTP_EXPIRED);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OTP_EXPIRED
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

    return HandleResponse(res, true, StatusCodes.OK, Message.OTP_MATCHED);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} verify otp.`);
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
    const { email, newPassword, confirmPassword } = req.body;
    const user = await findUserEmail({ email });
    if (!user) {
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
      );
    }

    if (newPassword !== confirmPassword) {
      logger.warn(Message.PASSWORD_MISMATCH);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.PASSWORD_MISMATCH
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserById(email, { password: hashedPassword });

    logger.info(`Password ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      `Password ${Message.UPDATED_SUCCESSFULLY}`
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} forgot passoword.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} forgot passoword.`
    );
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `User ${Message.NOT_FOUND}`
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
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} change password.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} change password.`
    );
  }
};