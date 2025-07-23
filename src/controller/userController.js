import { Message } from '../utils/constant/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';
import { approvalRequestTemplate, accountApprovedTemplate, accountCredentialsTemplate, passwordResetRequestTemplate, resetPasswordCredentialsTemplate } from '../utils/emailTemplates/emailTemplates.js'
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
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import User from '../models/userModel.js';
import { Enum } from '../utils/enum.js';
import { commonSearch } from '../helpers/commonFunction/search.js';
import { createVendorData, findVendorByUserId, updateVendorData } from '../services/jobService.js';

export const register = async (req, res, next) => {
  let { userName, email, password, confirmPassword, role, isActive, lastName, firstName } = req.body;
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

    const createdByAdmin = req.user?.role === Enum.ADMIN
    if (createdByAdmin || role === Enum.GUEST) {
      logger.info(`New user has ${Message.ADDED_SUCCESSFULLY} by admin`)
      const newUser = await createUser({ userName, email, password, confirmPassword, role, isActive, lastName, firstName });
      if (role === Enum.VENDOR || role === Enum.CLIENT) {
        const vendorData = { userId: newUser._id, ...req.body, type: newUser.role }
        const newVendor = await createVendorData(vendorData)
        await updateProfileById(newUser._id, { vendorProfileId: newVendor._id });
      }
      // const htmlContent = accountCredentialsTemplate({ email, password })
      // await sendingEmail({
      //   email_to: [email],
      //   subject: 'Your TalentBox Account Credentials',
      //   description: htmlContent,
      // });
    } else {
      const newUser = await createUser({ userName, email, password, confirmPassword, role, isActive: false, lastName, firstName });
      if (role === Enum.VENDOR || role === Enum.CLIENT) {
        const vendorData = { userId: newUser._id, type: newUser.role }
        const newVendor = await createVendorData(vendorData)
        await updateProfileById(newUser._id, { vendorProfileId: newVendor._id });
        const htmlBlock = approvalRequestTemplate({ userName, email, role })
        await sendingEmail({
          email_to: [process.env.HR_EMAIL],
          subject: 'New User Registration - Approval Required',
          description: htmlBlock,
        });
      }
    }

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

    if (!user.isActive) {
      return HandleResponse(
        res,
        false,
        StatusCodes.UNAUTHORIZED,
        Message.UNDER_APPROVAL
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

export const listOfUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const additionalFilter = {};
    if (role && Object.values(Enum).includes(role)) {
      additionalFilter.role = role;
    }
    if (search && typeof search === 'string') {
      const searchFields = [
        'userName',
        'email',
        'role',
        'firstName',
        'lastName',
      ];
      const searchResults = await commonSearch(
        User,
        searchFields,
        search,
        '',
        page,
        limit,
        { createdAt: -1 },
        additionalFilter
      );
      logger.info(`All profile are ${Message.FETCH_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `All profile are ${Message.FETCH_SUCCESSFULLY}`,
        searchResults
      );
    }

    const query = { isDeleted: false, ...additionalFilter };
    const paginatedData = await pagination({
      Schema: User,
      page,
      limit,
      query,
      sort: { createdAt: -1 },
    });
    logger.info(`All profile are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All profile are ${Message.FETCH_SUCCESSFULLY}`,
      paginatedData
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
        isActive,
        password,

        //vendor details
        whatsapp_number,
        vendor_linkedin_profile,
        company_name,
        company_email,
        company_phone_number,
        company_location,
        company_type,
        hire_resources,
        company_strength,
        company_time,
        company_linkedin_profile,
        company_website,
      } = req.body;

      let updateData = {
        firstName,
        lastName,
        userName,
        email,
        phoneNumber,
        dateOfBirth,
        designation,
        isActive
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

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

      const vendorUpdateData = {
        whatsapp_number,
        vendor_linkedin_profile,
        company_name,
        company_email,
        company_phone_number,
        company_location,
        company_type,
        hire_resources,
        company_strength,
        company_time,
        company_linkedin_profile,
        company_website,
      };

      Object.keys(vendorUpdateData).forEach(
        (key) => (vendorUpdateData[key] === undefined || vendorUpdateData[key] === null) && delete vendorUpdateData[key]
      );
      let updatedVendor = null;

      if (Object.keys(vendorUpdateData).length > 0) {
        const existingVendor = await findVendorByUserId({ userId: updatedUser._id })
        if (existingVendor) {
          updatedVendor = await updateVendorData(updatedUser._id, vendorUpdateData)
        } else {
          return HandleResponse(
            res,
            false,
            StatusCodes.NOT_FOUND,
            `Profile ${Message.NOT_FOUND}`
          );
        }
      }

      logger.info(`Profile ${Message.UPDATED_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `Profile ${Message.UPDATED_SUCCESSFULLY}`,
      );
    } catch (error) {
      logger.error(`${Message.FAILED_TO} update profile.`, error);
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
    // const newOtp = Math.floor(1000 + Math.random() * 9000);
    // const expireOtp = new Date(Date.now() + 2 * 60 * 1000);

    // logger.info(`${Message.OTP_SEND} OTP IS:- ${newOtp}`);

    // const data = await sendingEmail({ email, newOtp });

    const htmlContent = passwordResetRequestTemplate({ email })
    const data = await sendingEmail({ email_to: [process.env.HR_EMAIL], subject: 'Password Reset Request – TalentBox', description: htmlContent });
    if (!data) {
      logger.warn(`User ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `User ${Message.NOT_FOUND}`
      );
    }
    // await storeOtp(email, newOtp, expireOtp);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      Message.MAIL_SENT,
      // `OTP:-${newOtp}, will be expire in:${expireOtp}`
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

    const htmlContent = resetPasswordCredentialsTemplate({ email, password: newPassword })
    const data = await sendingEmail({ email_to: [email], subject: 'Your TalentBox Password Has Been Reset', description: htmlContent });
    if (!data) {
      logger.warn(`${Message.FAILED_TO} send new password to user`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `${Message.FAILED_TO} send new password to user`
      );
    }
    logger.info(`New password ${Message.SENT_SUCCESSFULLY} to user.`)
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

export const updateStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive, isDeleted } = req.body;
    const existingUser = await getUser({ _id: userId })
    if (!existingUser) {
      logger.warn(`Profile ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Profile ${Message.NOT_FOUND}`
      );
    }

    const updatedUser = await updateProfileById(userId, req.body);
    if (!updatedUser) {
      logger.warn(`Profile ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Profile ${Message.NOT_FOUND}`
      );
    }

    const isVendor = await findVendorByUserId({ userId: existingUser._id })
    if (isVendor) {
      await updateVendorData(userId, req.body);
    }

    if (existingUser.isActive === false && isActive === true) {
      const htmlBlock = accountApprovedTemplate({ userName: existingUser.userName })
      await sendingEmail({
        email_to: [existingUser.email],
        subject: 'Access Granted - Welcome to TalentBox',
        description: htmlBlock,
      });
    }
    let message;
    if (isActive !== undefined) {
      message =
        isActive === false
          ? `User ${Message.INACTIVE_SUCCESSFULLY}`
          : `User ${Message.ACTIVE_SUCCESSFULLY}`;
    } else if (isDeleted !== undefined) {
      message = `User ${Message.DELETED_SUCCESSFULLY}`;
    } else {
      message = `User ${Message.UPDATED_SUCCESSFULLY}`;
    }

    logger.info(message);
    return HandleResponse(res, true, StatusCodes.ACCEPTED, message, undefined);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update profile.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update profile.`
    );
  }
};