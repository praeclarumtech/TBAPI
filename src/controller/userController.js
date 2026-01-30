import { Message } from '../utils/constant/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import Vendor from '../models/vendorModel.js';
import fs from 'fs';
import xlsx from 'xlsx';
import csvParser from 'csv-parser';
import Role from '../models/roleModel.js';
import mongoose from 'mongoose';
import { CompanyTypeEnum } from '../utils/enum.js';
import { HireResourcesEnum } from '../utils/enum.js';
import {
  generateVendorCsv,
  vendorFieldMap,
} from '../helpers/commonFunction/vendorExport.js';
import { StatusCodes } from 'http-status-codes';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';
import {
  approvalRequestTemplate,
  accountApprovedTemplate,
  accountCredentialsTemplate,
  passwordResetRequestTemplate,
  resetPasswordCredentialsTemplate,
  vendorApprovalWithCredentialsTemplate,
} from '../utils/emailTemplates/emailTemplates.js';
dotenv.config();
import {
  createUser,
  getUser,
  getUserByUserName,
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
import {
  createVendorData,
  findVendorByUserId,
  updateVendorData,
} from '../services/jobService.js';
import roleModel from '../models/roleModel.js';
import { getRoleByNameService } from '../services/roleService.js';

export const register = async (req, res, next) => {
  let {
    userName,
    email,
    password,
    confirmPassword,
    role,
    isActive,
    lastName,
    firstName,
  } = req.body;
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

    const existingUserName = await getUserByUserName(userName);

    if (existingUserName) {
      logger.warn(`Username ${Message.ALREADY_EXIST}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Username ${Message.ALREADY_EXIST}`
      );
    }

    let roleId = null;

    const existingRole = await roleModel.findOne({ name: role });

    if (!existingRole) {
      logger.warn(`Role ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Role ${Message.NOT_FOUND}`
      );
    }

    roleId = existingRole._id;

    const createdByAdmin = req.user?.role === Enum.ADMIN;
    const isAdminFlag = createdByAdmin || false;
    if (createdByAdmin || role === Enum.GUEST) {
      logger.info(`New user has ${Message.ADDED_SUCCESSFULLY} by admin`);
      const newUser = await createUser({
        userName,
        email,
        password,
        confirmPassword,
        roleId,
        isActive,
        lastName,
        firstName,
        isAdmin: isAdminFlag, // Store isAdmin flag in database
        addedBy: req.user?._id || null,
        addedByRole: req.user?.role || null,
      });
      if (role === Enum.VENDOR || role === Enum.CLIENT) {
        const vendorData = {
          userId: newUser._id,
          ...req.body,
          type: newUser.role,
          isAdmin: isAdminFlag, // Store isAdmin flag in database
          addedBy: req.user?._id || null,
          addedByRole: req.user?.role || null,
        };
        const newVendor = await createVendorData(vendorData);
        await updateProfileById(newUser._id, {
          vendorProfileId: newVendor._id,
        });
      }
    } else {
      const newUser = await createUser({
        userName,
        email,
        password,
        confirmPassword,
        roleId,
        isActive: false,
        lastName,
        firstName,
        isAdmin: false, // Store isAdmin flag in database (false for non-admin created users)
      });
      if (role === Enum.VENDOR || role === Enum.CLIENT) {
        const vendorData = {
          userId: newUser._id,
          type: newUser.role,
          isAdmin: false, // Store isAdmin flag in database (false for non-admin created users)
        };
        const newVendor = await createVendorData(vendorData);
        await updateProfileById(newUser._id, {
          vendorProfileId: newVendor._id,
        });
        const htmlBlock = approvalRequestTemplate({ userName, email, role });
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

    // ✅ Populate role before creating token
    const userWithRole = await User.findById(user._id).populate('roleId');

    const expiresIn = process.env.EXPIRES_IN || '24h';
    logger.info(`Token expiration set to: ${expiresIn}`);

    const token = jwt.sign(
      {
        id: userWithRole._id,
        role: userWithRole.roleId?.name || 'N/A',
        accessModules: userWithRole.roleId?.accessModules || [],
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Decode token to verify expiration
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      logger.info(`Token will expire at: ${expirationDate.toISOString()}`);
    }

    logger.info(Message.USER_LOGGED_IN_SUCCESSFULLY);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.USER_LOGGED_IN_SUCCESSFULLY,
      { token } // send token + user profile
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} login.`, error);
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
    const loggedInUser = req.user; // Get the logged-in user from JWT token
    if (role) {
      const roleId = await roleModel.findOne({ name: role }).select('_id');
      if (!roleId) {
        logger.warn(`Role ${Message.NOT_FOUND}`);
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          `Role ${Message.NOT_FOUND}`
        );
      }
      additionalFilter.roleId = roleId;
    }

    // Define baseQuery with additional filters
    const baseQuery = { ...additionalFilter, isDeleted: false };

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
        baseQuery
      );

      // Remove duplicate userNames from search results
      if (searchResults.results && searchResults.results.length > 0) {
        const uniqueUsers = [];
        const seenUserNames = new Set();

        searchResults.results.forEach((user) => {
          if (!seenUserNames.has(user.userName)) {
            seenUserNames.add(user.userName);
            uniqueUsers.push(user);
          }
        });

        searchResults.results = uniqueUsers;
      }

      logger.info(`All profile are ${Message.FETCH_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `All profile are ${Message.FETCH_SUCCESSFULLY}`,
        searchResults
      );
    }

    const paginatedData = await pagination({
      Schema: User,
      page,
      limit,
      query: baseQuery,
      sort: { createdAt: -1 },
      populate: {
        path: 'vendorProfileId',
      },
    });

    // Remove duplicate userNames from the results to prevent UI duplicates
    if (paginatedData.item && paginatedData.item.length > 0) {
      const uniqueUsers = [];
      const seenUserNames = new Set();

      paginatedData.item.forEach((user) => {
        if (!seenUserNames.has(user.userName)) {
          seenUserNames.add(user.userName);
          uniqueUsers.push(user);
        }
      });

      paginatedData.item = uniqueUsers;
    }

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

    const user = await User.findById(userId).populate('roleId');
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
      logger.info(Message.INVALID_FILE_TYPE);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.INVALID_FILE_TYPE
      );
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
        isActive,
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

      // Get user with role information to check if they should have a vendor profile
      const userWithRole = await User.findById(userId).populate('roleId');

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
        (key) =>
          (vendorUpdateData[key] === undefined ||
            vendorUpdateData[key] === null) &&
          delete vendorUpdateData[key]
      );
      let updatedVendor = null;

      if (Object.keys(vendorUpdateData).length > 0) {
        const existingVendor = await findVendorByUserId({
          userId: updatedUser._id,
        });
        if (existingVendor) {
          updatedVendor = await updateVendorData(
            updatedUser._id,
            vendorUpdateData
          );
        } else {
          // Check if user is vendor or client and create vendor profile if it doesn't exist
          const userRole = userWithRole?.roleId?.name || userWithRole?.role;
          if (userRole === Enum.VENDOR || userRole === Enum.CLIENT) {
            // Determine if requester is admin
            const isAdminFlag = req.user?.role === Enum.ADMIN || false;
            const vendorData = {
              userId: updatedUser._id,
              ...vendorUpdateData,
              type: userRole,
              isAdmin: isAdminFlag, // Store isAdmin flag in database
            };
            const newVendor = await createVendorData(vendorData);
            await updateProfileById(updatedUser._id, {
              vendorProfileId: newVendor._id,
            });
            updatedVendor = newVendor;
          } else {
            return HandleResponse(
              res,
              false,
              StatusCodes.NOT_FOUND,
              `Profile ${Message.NOT_FOUND}`
            );
          }
        }
      }

      logger.info(`Profile ${Message.UPDATED_SUCCESSFULLY}`);
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `Profile ${Message.UPDATED_SUCCESSFULLY}`
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

    const htmlContent = passwordResetRequestTemplate({ email });
    const data = await sendingEmail({
      email_to: [process.env.HR_EMAIL],
      subject: 'Password Reset Request – TalentBox',
      description: htmlContent,
    });
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
      Message.MAIL_SENT
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

    const htmlContent = resetPasswordCredentialsTemplate({
      email,
      password: newPassword,
    });
    const data = await sendingEmail({
      email_to: [email],
      subject: 'Your TalentBox Password Has Been Reset',
      description: htmlContent,
    });
    if (!data) {
      logger.warn(`${Message.FAILED_TO} send new password to user`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `${Message.FAILED_TO} send new password to user`
      );
    }
    logger.info(`New password ${Message.SENT_SUCCESSFULLY} to user.`);
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
    user.password = newPassword; // Pre-save hook will hash it
    user.passwordChanged = true; // Mark password as changed
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

const generateTemporaryPassword = () => {
  const length = 12;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
  let password = '';
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '@#$%&*'[Math.floor(Math.random() * 6)];

  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

export const updateStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    let { isActive, isDeleted, isAdmin } = req.body;

    const existingUser = await getUser({ _id: userId });
    if (!existingUser) {
      logger.warn(`Profile ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Profile ${Message.NOT_FOUND}`
      );
    }

    const userWithRole = await User.findById(userId).populate('roleId');
    const userRole = userWithRole?.roleId?.name || userWithRole?.role || '';
    const normalizedRole = userRole.toLowerCase();
    const isVendorOrClient =
      normalizedRole === Enum.VENDOR.toLowerCase() ||
      normalizedRole === Enum.CLIENT.toLowerCase();

    if (existingUser.isActive === false && isAdmin === true) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Cannot approve ${normalizedRole}. Please activate them first.`
      );
    }
    let tempPassword = null;
    const isApproving = existingUser.isActive === true;

    if (isApproving && isVendorOrClient) {
      tempPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      req.body.password = hashedPassword;
    }

    if (isAdmin !== undefined) {
      req.body.isAdmin = isAdmin;
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

    const isVendor = await findVendorByUserId({ userId: existingUser._id });
    if (isVendor) {
      await updateVendorData(userId, req.body);
    }
    if (isApproving && isAdmin === true) {
      try {
        if (isVendorOrClient && tempPassword) {
          const htmlBlock = vendorApprovalWithCredentialsTemplate({
            userName: existingUser.userName,
            email: existingUser.email,
            password: tempPassword,
            role: userRole,
          });
          await sendingEmail({
            email_to: [existingUser.email],
            subject: 'Account Approved – Your TalentBox Login Credentials',
            description: htmlBlock,
          });
          logger.info(
            `Approval email with credentials sent to ${existingUser.email}`
          );
        } else {
          const htmlBlock = accountApprovedTemplate({
            userName: existingUser.userName,
          });
          await sendingEmail({
            email_to: [existingUser.email],
            subject: 'Access Granted - Welcome to TalentBox',
            description: htmlBlock,
          });
        }
      } catch (emailError) {
        logger.error(
          `Failed to send approval email: ${emailError.message}`,
          emailError
        );
      }
    }

    const finalUpdatedUser = await User.findById(userId)
      .populate('roleId')
      .populate('addedBy', 'userName email')
      .select('-password');

    const vendorInfo = await findVendorByUserId({ userId: existingUser._id });

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

    const responseData = {
      userId: finalUpdatedUser._id,
      userName: finalUpdatedUser.userName,
      email: finalUpdatedUser.email,
      isActive: finalUpdatedUser.isActive,
      isDeleted: finalUpdatedUser.isDeleted,
      isAdmin: finalUpdatedUser.isAdmin || false,
      role: userRole,
      addedBy: finalUpdatedUser.addedBy || null,
      addedByRole:
        finalUpdatedUser.addedByRole || vendorInfo?.addedByRole || null,
      ...(isVendorOrClient && tempPassword && { emailSent: true }),
    };

    logger.info(message);
    return HandleResponse(
      res,
      true,
      StatusCodes.ACCEPTED,
      message,
      responseData
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
};

export const importvendorCsv = async (req, res) => {
  try {
    const updateFlag =
      req.query.updateFlag === 'true'
        ? true
        : req.query.updateFlag === 'false'
          ? false
          : undefined;

    if (!req.file) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'No file uploaded'
      );
    }

    // ✅ Load roles
    const roleData = await Role.findOne({ name: req.body.role });

    if (!roleData) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Vendor or Client role not found in Role collection'
      );
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    // Helper function to remove BOM and clean header strings
    const cleanHeader = (str) => {
      if (!str) return '';
      // Remove BOM (Byte Order Mark) and other invisible characters
      return str
        .replace(/^\uFEFF/, '')
        .replace(/^\ufeff/, '')
        .trim();
    };

    // ✅ Parse CSV
    if (ext === '.csv') {
      rows = await new Promise((resolve, reject) => {
        let headers = [];
        const data = [];
        let isFirstRow = true;

        fs.createReadStream(req.file.path, { encoding: 'utf8' })
          .pipe(csvParser({ headers: false, skipEmptyLines: true }))
          .on('data', (row) => {
            const values = Object.values(row);
            if (isFirstRow) {
              // First row contains headers - clean them properly
              headers = values.map((h, index) => {
                let cleaned = cleanHeader(String(h || ''));
                // Log first header for debugging BOM issues
                if (index === 0) {
                  logger.info(
                    `First CSV header after cleaning: "${cleaned}" (length: ${cleaned.length})`
                  );
                }
                return cleaned;
              });
              isFirstRow = false;
            } else {
              const formatted = {};
              values.forEach((val, i) => {
                if (headers[i]) {
                  formatted[headers[i]] = (val?.toString() || '').trim();
                }
              });
              data.push(formatted);
            }
          })
          .on('end', () => {
            logger.info(
              `CSV parsed: ${headers.length} headers, ${data.length} data rows`
            );
            logger.info(`Headers found: ${headers.join(', ')}`);
            resolve(data);
          })
          .on('error', (err) => reject(err));
      });
    }
    // ✅ Parse Excel
    else if (['.xlsx', '.xls', '.xlsm', '.xltx', '.xlsb'].includes(ext)) {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.SheetNames[0];
      const workSheet = workbook.Sheets[sheet];

      const exponentialFormatRegex = /^[+-]?\d+(\.\d+)?e[+-]?\d+$/i;
      Object.keys(workSheet).forEach((cellKey) => {
        if (
          workSheet[cellKey].w &&
          workSheet[cellKey].t === 'n' &&
          exponentialFormatRegex.test(workSheet[cellKey].w)
        ) {
          // Convert scientific notation to full number string
          workSheet[cellKey].w = String(workSheet[cellKey].v);
        }
      });

      rows = xlsx.utils.sheet_to_json(workSheet, {
        defval: '',
        raw: false,
      });
    } else {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Unsupported file type (CSV/XLSX only)'
      );
    }

    // ✅ Validation
    const validVendors = [];
    const validationErrors = [];

    rows.forEach((row, index) => {
      const line = index + 1;

      const vendor = {
        username: row.Username?.trim() || row.username?.trim() || '',
        email:
          row.Email?.trim().toLowerCase() ||
          row.email?.trim().toLowerCase() ||
          '',
        firstName: row.firstName?.trim() || row['First Name']?.trim() || '',
        lastName: row.lastName?.trim() || row['Last Name']?.trim() || '',
        role: req.body.role || row.role?.trim().toLowerCase() || '',
        whatsapp_number: (() => {
          // Try multiple field name variations for WhatsApp number
          let whatsappValue =
            row.whatsapp_number ||
            row['Whatsapp Number'] ||
            row['WhatsApp Number'] ||
            row['whatsapp number'] ||
            row['WhatsApp'] ||
            row.whatsApp ||
            '';

          // Convert to string if it's a number
          if (typeof whatsappValue === 'number') {
            whatsappValue = String(whatsappValue);
          } else if (whatsappValue) {
            whatsappValue = whatsappValue.toString().trim();
          } else {
            return '';
          }

          if (/^[+-]?\d+(\.\d+)?e[+-]?\d+$/i.test(whatsappValue)) {
            const numValue = parseFloat(whatsappValue);
            whatsappValue = String(numValue).replace(/\.0+$/, '');
          }

          if (whatsappValue) {
            const cleaned = whatsappValue.replace(/[^\d]/g, '');
            return cleaned;
          }

          return '';
        })(),
        company_type:
          row.company_type?.trim().toLowerCase() ||
          row['Company Type']?.trim().toLowerCase() ||
          '',
        hire_resources:
          row.hire_resources?.trim().toLowerCase() ||
          row['Hire Resources']?.trim().toLowerCase() ||
          '',
        company_name:
          row.company_name?.trim() || row['Company Name']?.trim() || '',
        company_email:
          row.company_email?.trim().toLowerCase() ||
          row['Company Email']?.trim().toLowerCase() ||
          '',
        company_phone_number:
          row.company_phone_number?.trim() ||
          row['Company Phone Number']?.trim() ||
          '',
        company_location:
          row.company_location?.trim() || row['Company Location']?.trim() || '',
        company_strength:
          row.company_strength?.trim() || row['Company Strength']?.trim() || '',
        company_linkedin_profile:
          row.company_linkedin_profile?.trim() ||
          row['Company Linkedin']?.trim() ||
          '',
        company_website:
          row.company_website?.trim() || row['Company Website']?.trim() || '',
        vendor_linkedin_profile:
          row.vendor_linkedin_profile?.trim() ||
          row['Vendor Linkedin']?.trim() ||
          '',
      };

      // Debug logging for WhatsApp number extraction
      if (line === 1) {
        logger.info(`Sample row data for debugging:`, {
          rowKeys: Object.keys(row),
          whatsappFields: {
            whatsapp_number: row.whatsapp_number,
            'Whatsapp Number': row['Whatsapp Number'],
            'WhatsApp Number': row['WhatsApp Number'],
            extracted: vendor.whatsapp_number,
          },
        });
      }

      const requiredFieldErrors = [];
      const invalidValueErrors = [];

      if (!vendor.username) requiredFieldErrors.push('username');
      if (!vendor.email) requiredFieldErrors.push('email');
      if (!vendor.role) requiredFieldErrors.push('role');
      if (!vendor.whatsapp_number) requiredFieldErrors.push('whatsapp_number');
      if (!vendor.company_type) requiredFieldErrors.push('company_type');
      if (!vendor.hire_resources) requiredFieldErrors.push('hire_resources');

      // Check for invalid values only if field exists
      if (vendor.role && !['vendor', 'client'].includes(vendor.role)) {
        invalidValueErrors.push(`Invalid role: ${vendor.role}`);
      }
      if (
        vendor.company_type &&
        !Object.values(CompanyTypeEnum).includes(vendor.company_type)
      ) {
        invalidValueErrors.push(`Invalid company_type: ${vendor.company_type}`);
      }
      if (
        vendor.hire_resources &&
        !Object.values(HireResourcesEnum).includes(vendor.hire_resources)
      ) {
        invalidValueErrors.push(
          `Invalid hire_resources: ${vendor.hire_resources}`
        );
      }

      if (requiredFieldErrors.length > 0 || invalidValueErrors.length > 0) {
        const lineErrors = [];
        if (requiredFieldErrors.length > 0) {
          lineErrors.push(
            `Line ${line}: ${requiredFieldErrors.join(', ')} ${requiredFieldErrors.length === 1 ? 'is' : 'are'} required`
          );
        }
        if (invalidValueErrors.length > 0) {
          lineErrors.push(`Line ${line}: ${invalidValueErrors.join(', ')}`);
        }
        validationErrors.push({
          line,
          requiredFields: requiredFieldErrors,
          invalidValues: invalidValueErrors,
          message: lineErrors.join('; '),
        });
      } else {
        validVendors.push(vendor);
      }
    });

    if (validationErrors.length) {
      fs.unlinkSync(req.file.path);

      // Group errors by type
      const requiredFieldsGroup = [];
      const invalidValuesGroup = [];

      validationErrors.forEach((error) => {
        if (error.requiredFields.length > 0) {
          requiredFieldsGroup.push(
            `Line ${error.line}: ${error.requiredFields.join(', ')} ${error.requiredFields.length === 1 ? 'is' : 'are'} required`
          );
        }
        if (error.invalidValues.length > 0) {
          invalidValuesGroup.push(
            `Line ${error.line}: ${error.invalidValues.join(', ')}`
          );
        }
      });

      // Format response message
      const errorMessages = [];
      if (requiredFieldsGroup.length > 0) {
        errorMessages.push('Required Fields Errors:');
        errorMessages.push(...requiredFieldsGroup);
      }
      if (invalidValuesGroup.length > 0) {
        if (errorMessages.length > 0) errorMessages.push(''); // Add separator
        errorMessages.push('Invalid Values Errors:');
        errorMessages.push(...invalidValuesGroup);
      }

      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, errorMessages);
    }

    const seenEmails = new Set();
    const seenPhones = new Set();
    const seenUsernames = new Set();
    const duplicateErrors = [];

    validVendors.forEach((v, i) => {
      const line = i + 1;

      const emailKey = (v.company_email || v.email).trim().toLowerCase();
      const phone = v.whatsapp_number.trim();
      const username = v.username.trim();

      if (seenUsernames.has(username)) {
        duplicateErrors.push(
          `Line ${line}: Duplicate username (${username}) inside file`
        );
      }
      seenUsernames.add(username);

      if (seenEmails.has(emailKey)) {
        duplicateErrors.push(
          `Line ${line}: Duplicate email (${emailKey}) inside file`
        );
      }
      seenEmails.add(emailKey);

      if (seenPhones.has(phone)) {
        duplicateErrors.push(
          `Line ${line}: Duplicate whatsapp_number (${phone}) inside file`
        );
      }
      seenPhones.add(phone);
    });

    if (duplicateErrors.length) {
      fs.unlinkSync(req.file.path);

      // Format duplicate errors
      const formattedErrors = [];
      formattedErrors.push('Duplicate Errors:');
      formattedErrors.push(...duplicateErrors);

      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        formattedErrors
      );
    }

    const dbVendors = await Vendor.find({
      $or: [
        { company_email: { $in: [...seenEmails] } },
        { whatsapp_number: { $in: [...seenPhones] } },
      ],
    }).lean();

    const dbUsers = await User.find({
      userName: { $in: [...seenUsernames] },
    }).lean();

    const dbDupErrors = [];

    const dbEmails = new Set(
      dbVendors.map((v) => (v.company_email || '').trim().toLowerCase())
    );
    const dbPhones = new Set(
      dbVendors.map((v) => (v.whatsapp_number || '').trim())
    );
    const dbUsernames = new Set(dbUsers.map((u) => u.userName.trim()));

    validVendors.forEach((v, i) => {
      const line = i + 1;
      const emailKey = (v.company_email || v.email).trim().toLowerCase();
      const phone = v.whatsapp_number.trim();
      const username = v.username.trim();

      if (dbEmails.has(emailKey)) {
        dbDupErrors.push(
          `Line ${line}: Email already exists in DB (${emailKey})`
        );
      }
      if (dbPhones.has(phone)) {
        dbDupErrors.push(
          `Line ${line}: whatsapp_number already exists in DB (${phone})`
        );
      }
      if (dbUsernames.has(username)) {
        dbDupErrors.push(
          `Line ${line}: Username already exists in DB (${username})`
        );
      }
    });

    if (dbDupErrors.length && updateFlag !== true) {
      fs.unlinkSync(req.file.path);

      // Collect only the duplicate emails that are actually in the CSV
      const duplicateEmails = validVendors
        .filter((v) => {
          const emailKey = (v.company_email || v.email).trim().toLowerCase();
          return dbEmails.has(emailKey);
        })
        .map((v) => (v.company_email || v.email).trim().toLowerCase());

      // Format database duplicate errors
      const formattedDbErrors = [];
      formattedDbErrors.push('Duplicate Errors (Already exists in database):');
      formattedDbErrors.push(...dbDupErrors);

      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        formattedDbErrors,
        {
          duplicateEmails: [...new Set(duplicateEmails)],
        }
      );
    }

    const inserted = [];
    const updated = [];
    const skipped = [];
    const updateErrors = [];

    for (const vendor of validVendors) {
      const emailKey = (vendor.company_email || vendor.email)
        .trim()
        .toLowerCase();
      const phone = vendor.whatsapp_number.trim();
      const username = vendor.username.trim();

      const existingVendor = await Vendor.findOne({
        $or: [{ company_email: emailKey }, { whatsapp_number: phone }],
      });

      const existingUser = await User.findOne({ userName: username });

      if (existingVendor && updateFlag === true) {
        try {
          // Prepare vendor update data - update all company fields from CSV
          const vendorUpdateData = {
            whatsapp_number: vendor.whatsapp_number || '',
            vendor_linkedin_profile: vendor.vendor_linkedin_profile || '',
            company_name: vendor.company_name || '',
            company_email: (
              vendor.company_email ||
              vendor.email ||
              ''
            ).toLowerCase(),
            company_phone_number: vendor.company_phone_number || '',
            company_location: vendor.company_location || '',
            company_type: vendor.company_type || '',
            hire_resources: vendor.hire_resources || '',
            company_strength: vendor.company_strength || '',
            company_linkedin_profile: vendor.company_linkedin_profile || '',
            company_website: vendor.company_website || '',
            type: vendor.role || existingVendor.type || 'vendor',
          };

          logger.info(`Updating vendor ${emailKey} with company fields:`, {
            company_name: vendorUpdateData.company_name,
            company_email: vendorUpdateData.company_email,
            company_location: vendorUpdateData.company_location,
            whatsapp_number: vendorUpdateData.whatsapp_number,
          });

          await Vendor.updateOne(
            { _id: existingVendor._id },
            { $set: vendorUpdateData }
          );

          if (existingVendor.userId) {
            const userUpdateData = {};
            if (vendor.firstName) {
              userUpdateData.firstName = vendor.firstName;
            }
            if (vendor.lastName !== undefined) {
              userUpdateData.lastName = vendor.lastName;
            }
            if (vendor.email) {
              userUpdateData.email = vendor.email.toLowerCase();
            }

            if (Object.keys(userUpdateData).length > 0) {
              await User.updateOne(
                { _id: existingVendor.userId },
                { $set: userUpdateData }
              );
            }

            const existingUser = await User.findById(existingVendor.userId);
            if (existingUser && !existingUser.vendorProfileId) {
              await updateProfileById(existingVendor.userId, {
                vendorProfileId: existingVendor._id,
              });
              logger.info(
                `Linked User ${existingVendor.userId} to Vendor ${existingVendor._id}`
              );
            }
          }

          updated.push(emailKey);
          continue;
        } catch (err) {
          updateErrors.push(`Failed to update ${emailKey}: ${err.message}`);
          skipped.push(emailKey);
          continue;
        }
      }

      if (existingVendor && updateFlag !== true) {
        skipped.push(emailKey);
        updateErrors.push(`Duplicate record found: ${emailKey}`);
        continue;
      }

      if (existingUser && updateFlag !== true) {
        skipped.push(emailKey);
        updateErrors.push(`Duplicate username found: ${username}`);
        continue;
      }

      try {
        const roleId = roleData._id;
        const hashedPassword = await bcrypt.hash('Vendor@123', 10);

        const user = await User.create({
          userName: vendor.username,
          email: vendor.email,
          password: hashedPassword,
          roleId,
          firstName:
            vendor.firstName ||
            vendor.company_name ||
            vendor.role.toUpperCase(),
          lastName: vendor.lastName || '',
          isActive: true,
        });

        const vendorData = {
          userId: user._id,
          type: vendor.role || 'vendor',
          whatsapp_number: vendor.whatsapp_number || '',
          vendor_linkedin_profile: vendor.vendor_linkedin_profile || '',
          company_name: vendor.company_name || '',
          company_email: (
            vendor.company_email ||
            vendor.email ||
            ''
          ).toLowerCase(),
          company_phone_number: vendor.company_phone_number || '',
          company_location: vendor.company_location || '',
          company_type: vendor.company_type || '',
          hire_resources: vendor.hire_resources || '',
          company_strength: vendor.company_strength || '',
          company_linkedin_profile: vendor.company_linkedin_profile || '',
          company_website: vendor.company_website || '',
        };

        const newVendor = await Vendor.create(vendorData);

        await updateProfileById(user._id, {
          vendorProfileId: newVendor._id,
        });

        logger.info(`Linked User ${user._id} to Vendor ${newVendor._id}`);

        inserted.push(emailKey);
      } catch (err) {
        logger.error(`Failed to create vendor for ${emailKey}:`, err);
        skipped.push(emailKey);
        updateErrors.push(`Failed to create ${emailKey}: ${err.message}`);
      }
    }

    fs.unlinkSync(req.file.path);

    return HandleResponse(res, true, StatusCodes.OK, 'Import completed.', {
      inserted,
      updated,
      skipped,
      updateErrors,
    });
  } catch (err) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unexpected error during import'
    );
  }
};

export const exportVendorCsv = async (req, res) => {
  try {
    if (req.user?.role !== Enum.ADMIN) {
      return HandleResponse(
        res,
        false,
        StatusCodes.UNAUTHORIZED,
        'Only admin can export vendor/client data.'
      );
    }

    const { role, ids, fields } = req.body;
    const roleType = role?.toLowerCase();

    if (!['vendor', 'client'].includes(roleType)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Invalid role. Use role='vendor' or role='client'"
      );
    }

    // ✅ Get vendor/client role
    const vendorRole = await getRoleByNameService(
      roleType === 'vendor' ? Enum.VENDOR : Enum.CLIENT
    );
    if (!vendorRole) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `${roleType} role not found`
      );
    }

    const vendorQuery = { isDeleted: false, type: roleType };
    if (ids?.length > 0) {
      try {
        const objectIds = ids
          .map((id) => {
            if (mongoose.Types.ObjectId.isValid(id)) {
              return new mongoose.Types.ObjectId(id);
            }
            return null;
          })
          .filter((id) => id !== null);

        if (objectIds.length > 0) {
          vendorQuery._id = { $in: objectIds };
        }
      } catch (err) {
        logger.warn('Invalid ids provided, ignoring ids filter', err);
      }
    }

    const vendorRecords = await Vendor.find(vendorQuery).lean();
    logger.info(
      `Found ${vendorRecords.length} Vendor records for type: ${roleType}`
    );

    if (!vendorRecords.length) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `No ${roleType} records found`
      );
    }

    const userIds = vendorRecords
      .map((record) => record.userId)
      .filter((id) => id)
      .map((id) => {
        if (typeof id === 'object' && id._id) return id._id.toString();
        if (typeof id === 'object' && id.toString) return id.toString();
        return String(id);
      });

    const uniqueUserIds = [
      ...new Set(userIds.filter((id) => mongoose.Types.ObjectId.isValid(id))),
    ];
    const usersMap = new Map();

    if (uniqueUserIds.length > 0) {
      const userObjectIds = uniqueUserIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const users = await User.find({ _id: { $in: userObjectIds } }).lean();
      users.forEach((user) => {
        usersMap.set(user._id.toString(), user);
      });
    }

    logger.info(
      `Fetched ${usersMap.size} users for ${uniqueUserIds.length} unique userIds`
    );

    const combinedData = [];
    const processedVendorIds = new Set();

    for (const vendorRecord of vendorRecords) {
      const vendorId = vendorRecord._id?.toString() || String(vendorRecord._id);

      if (processedVendorIds.has(vendorId)) {
        continue;
      }
      processedVendorIds.add(vendorId);

      let userId = '';
      let user = null;

      if (vendorRecord.userId) {
        if (
          typeof vendorRecord.userId === 'object' &&
          vendorRecord.userId._id
        ) {
          userId = vendorRecord.userId._id.toString();
        } else if (
          typeof vendorRecord.userId === 'object' &&
          vendorRecord.userId.toString
        ) {
          userId = vendorRecord.userId.toString();
        } else {
          userId = String(vendorRecord.userId);
        }

        user = usersMap.get(userId) || null;
      }

      combinedData.push({
        userId: userId || '',
        username: user?.userName || '',
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        role: roleType,
        whatsapp_number: vendorRecord.whatsapp_number || '',
        company_name: vendorRecord.company_name || '',
        company_email: vendorRecord.company_email || '',
        company_phone_number: vendorRecord.company_phone_number || '',
        company_location: vendorRecord.company_location || '',
        company_type: vendorRecord.company_type || '',
        hire_resources: vendorRecord.hire_resources || '',
        company_strength: vendorRecord.company_strength || '',
        company_linkedin_profile: vendorRecord.company_linkedin_profile || '',
        company_website: vendorRecord.company_website || '',
        vendor_linkedin_profile: vendorRecord.vendor_linkedin_profile || '',
      });
    }

    logger.info(`Processed ${combinedData.length} records for export`);

    if (!combinedData.length) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `No ${roleType} records found`
      );
    }
    const csv = generateVendorCsv(combinedData, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${roleType}_export.csv`
    );

    return res.status(StatusCodes.OK).send(csv);
  } catch (error) {
    logger.error('Failed to export vendor/client CSV', error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to export vendor/client CSV: ${error.message || 'Unknown error'}`
    );
  }
};

export const getCsvvendorclient = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      company_type,
      hire_resources,
      company_name,
      company_location,
      email,
      company_email,
      vendor_linkedin_profile,
      company_strength,
      startDate,
      endDate,
      company_phone_number,
      type,
    } = req.query;

    if (!['vendor', 'client'].includes(type)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid type. Use ?type=vendor or ?type=client'
      );
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query = {
      isDeleted: false,
      type,
    };

    if (company_type) query.company_type = company_type;
    if (hire_resources) query.hire_resources = hire_resources;

    if (company_name)
      query.company_name = { $regex: new RegExp(company_name, 'i') };

    if (company_location)
      query.company_location = { $regex: new RegExp(company_location, 'i') };

    if (email) query.email = { $regex: new RegExp(email, 'i') };

    if (company_email)
      query.company_email = { $regex: new RegExp(company_email, 'i') };

    if (vendor_linkedin_profile)
      query.vendor_linkedin_profile = {
        $regex: new RegExp(vendor_linkedin_profile, 'i'),
      };

    if (company_phone_number) {
      const rangeMatch = company_phone_number.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        query.company_phone_number = { $gte: min, $lte: max };
      } else {
        query.company_phone_number = company_phone_number;
      }
    }

    if (company_strength) {
      const rangeMatch = company_strength.toString().match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        query.company_strength = { $gte: min, $lte: max };
      } else {
        query.company_strength = parseInt(company_strength);
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate)
        query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (search && typeof search === 'string') {
      const searchFields = [
        'company_name',
        'email',
        'company_email',
        'company_phone_number',
        'company_location',
        'vendor_linkedin_profile',
      ];

      const searchResults = await commonSearch(
        Vendor,
        searchFields,
        search,
        search,
        pageNum,
        limitNum,
        query
      );

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } list fetched successfully`,
        searchResults
      );
    }

    const results = await pagination({
      Schema: Vendor,
      page: pageNum,
      limit: limitNum,
      query,
      sort: { createdAt: -1 },
    });

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } list fetched successfully`,
      results
    );
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to fetch ${req.query.type} list. ${error.message}`
    );
  }
};

/**
 * Download sample CSV template for vendor/client import
 * GET /api/user/sample-csv?type=vendor|client
 *
 * Required fields: Email, First Name, Last Name, Username, Whatsapp Number, Company Type, Hire Resources
 * Company Type options: product, service, both
 * Hire Resources options: c2c, c2h, in-house, all
 */
export const downloadSampleCsv = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || !['vendor', 'client'].includes(type.toLowerCase())) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid type. Use ?type=vendor or ?type=client'
      );
    }

    const roleType = type.toLowerCase();

    // Define CSV headers (matching the expected import format)
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Username',
      'Whatsapp Number',
      'Company Name',
      'Company Email',
      'Company Phone Number',
      'Company Location',
      'Company Type',
      'Hire Resources',
      'Company Strength',
      'Company Linkedin',
      'Company Website',
      'Vendor Linkedin',
      'Role',
    ];

    // Sample data rows with placeholder values - user must replace these
    const timestamp = Date.now();
    // Generate unique phone numbers using last 10 digits of timestamp
    const phoneBase = String(timestamp).slice(-10);
    const phone1 = phoneBase.slice(0, 10).padStart(10, '9');
    const phone2 = String(Number(phone1) + 1);

    const sampleRow1 = [
      `john.doe_${timestamp}@example.com`,
      'John',
      'Doe',
      `johndoe_${timestamp}`,
      phone1,
      'Tech Solutions Pvt Ltd',
      `contact_${timestamp}@techsolutions.com`,
      phone1,
      'Mumbai',
      'product',
      'c2c',
      '10-50',
      '',
      '',
      '',
      roleType,
    ];

    const sampleRow2 = [
      `jane.smith_${timestamp}@example.com`,
      'Jane',
      'Smith',
      `janesmith_${timestamp}`,
      phone2,
      'Digital Services Inc',
      `info_${timestamp}@digitalservices.com`,
      phone2,
      'Bangalore',
      'service',
      'c2h',
      '50-100',
      '',
      '',
      '',
      roleType,
    ];

    // Build CSV content (no comments - clean CSV)
    const csvRows = [
      headers.join(','),
      sampleRow1.join(','),
      sampleRow2.join(','),
    ];

    const csvContent = csvRows.join('\n');

    const filename = `sample_${roleType}_import_template.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    return res.status(StatusCodes.OK).send(csvContent);
  } catch (error) {
    logger.error(`Failed to generate sample CSV: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to generate sample CSV: ${error.message}`
    );
  }
};
