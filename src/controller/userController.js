import { Message } from '../utils/constant/message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../loggers/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import Vendor from '../models/vendorModel.js';
import fs from 'fs';
import xlsx from 'xlsx';
import csvParser from "csv-parser";
import Role from '../models/roleModel.js';
import { CompanyTypeEnum } from '../utils/enum.js';
import { HireResourcesEnum } from '../utils/enum.js';
import { generateVendorCsv, vendorFieldMap } from '../helpers/commonFunction/vendorExport.js';
import { StatusCodes } from 'http-status-codes';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';
import {
  approvalRequestTemplate,
  accountApprovedTemplate,
  accountCredentialsTemplate,
  passwordResetRequestTemplate,
  resetPasswordCredentialsTemplate,
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
      });
      if (role === Enum.VENDOR || role === Enum.CLIENT) {
        const vendorData = {
          userId: newUser._id,
          ...req.body,
          type: newUser.role,
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
      });
      if (role === Enum.VENDOR || role === Enum.CLIENT) {
        const vendorData = { userId: newUser._id, type: newUser.role };
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

    const token = jwt.sign(
      {
        id: userWithRole._id,
        role: userWithRole.roleId?.name || 'N/A',
        accessModules: userWithRole.roleId?.accessModules || [],
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

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
    if (role && Object.values(Enum).includes(role)) {
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
    const baseQuery = { ...additionalFilter };

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
            const vendorData = {
              userId: updatedUser._id,
              ...vendorUpdateData,
              type: userRole,
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

    if (existingUser.isActive === false && isActive === true) {
      const htmlBlock = accountApprovedTemplate({
        userName: existingUser.userName,
      });
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

export const importvendorCsv = async (req, res) => {
  try {
    const updateFlag =
      req.query.updateFlag === "true"
        ? true
        : req.query.updateFlag === "false"
          ? false
          : undefined;

    if (!req.file) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "No file uploaded"
      );
    }

    // ✅ Load vendor role
    const vendorRole = await Role.findOne({ name: Enum.VENDOR });
    if (!vendorRole) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Vendor role not found in Role collection"
      );
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    // ✅ Parse CSV
    if (ext === ".csv") {
      rows = await new Promise((resolve, reject) => {
        let headers = [];
        let data = [];

        fs.createReadStream(req.file.path)
          .pipe(csvParser({ headers: false, skipEmptyLines: true }))
          .on("data", (row) => {
            if (!headers.length) {
              headers = Object.values(row).map((h) => h.trim());
            } else {
              const formatted = {};
              Object.values(row).forEach((val, i) => {
                formatted[headers[i]] = val?.trim() || "";
              });
              data.push(formatted);
            }
          })
          .on("end", () => resolve(data))
          .on("error", (err) => reject(err));
      });
    }
    // ✅ Parse Excel
    else if ([".xlsx", ".xls", ".xlsm", ".xltx", ".xlsb"].includes(ext)) {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet], {
        defval: "",
        raw: false,
      });
    } else {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Unsupported file type (CSV/XLSX only)"
      );
    }

    // ✅ Validation
    const validVendors = [];
    const validationErrors = [];

    rows.forEach((row, index) => {
      const line = index + 1;
      const vendor = {
        username: row.username?.trim() || "",
        email: row.email?.trim().toLowerCase() || "",
        whatsapp_number: row.whatsapp_number?.trim() || "",
        company_type: row.company_type?.trim().toUpperCase() || "",
        hire_resources: row.hire_resources?.trim().toUpperCase() || "",
        company_name: row.company_name?.trim() || "",
        company_email: row.company_email?.trim().toLowerCase() || "",
        company_phone_number: row.company_phone_number?.trim() || "",
        company_location: row.company_location?.trim() || "",
        company_strength: row.company_strength?.trim() || "",
        company_linkedin_profile: row.company_linkedin_profile?.trim() || "",
        company_website: row.company_website?.trim() || "",
        vendor_linkedin_profile: row.vendor_linkedin_profile?.trim() || "",
      };

      const errs = [];

      if (!vendor.username) errs.push("username is required");
      if (!vendor.email) errs.push("email is required");
      if (!vendor.whatsapp_number) errs.push("whatsapp_number is required");

      if (!vendor.company_type) {
        errs.push("company_type is required");
      } else if (
        !Object.values(CompanyTypeEnum)
          .map((v) => v.toUpperCase())
          .includes(vendor.company_type)
      ) {
        errs.push(`Invalid company_type: ${vendor.company_type}`);
      }

      if (!vendor.hire_resources) {
        errs.push("hire_resources is required");
      } else if (
        !Object.values(HireResourcesEnum)
          .map((v) => v.toUpperCase())
          .includes(vendor.hire_resources)
      ) {
        errs.push(`Invalid hire_resources: ${vendor.hire_resources}`);
      }

      if (errs.length) {
        validationErrors.push(`Line ${line}: ${errs.join(", ")}`);
      } else {
        validVendors.push(vendor);
      }
    });

    if (validationErrors.length) {
      fs.unlinkSync(req.file.path);
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, validationErrors);
    }

    // ✅ Check duplicates in file
    const seenEmails = new Set();
    const seenPhones = new Set();
    const seenUsernames = new Set();
    const duplicateErrors = [];

    validVendors.forEach((v, i) => {
      const line = i + 1;
      if (seenUsernames.has(v.username)) {
        duplicateErrors.push(`Duplicate username in file at line ${line}`);
      }
      seenUsernames.add(v.username);

      const emailKey = v.company_email || v.email;
      if (seenEmails.has(emailKey)) {
        duplicateErrors.push(`Duplicate email in file at line ${line}`);
      }
      seenEmails.add(emailKey);

      if (seenPhones.has(v.whatsapp_number)) {
        duplicateErrors.push(`Duplicate whatsapp_number in file at line ${line}`);
      }
      seenPhones.add(v.whatsapp_number);
    });

    if (duplicateErrors.length) {
      fs.unlinkSync(req.file.path);
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, duplicateErrors);
    }

    // ✅ Check existing vendors and users
    const existing = await Vendor.find({
      company_email: { $in: Array.from(seenEmails) },
    }).lean();

    const existingUsers = await User.find({
      userName: { $in: Array.from(seenUsernames) },
    }).lean();

    const existingEmails = new Set(existing.map((v) => v.company_email));
    const existingUsernames = new Set(existingUsers.map((u) => u.userName));

    const inserted = [];
    const updated = [];
    const skipped = [];
    const updateErrors = [];

    // ✅ Insert / Update Process
    for (const vendor of validVendors) {
      const emailKey = vendor.company_email || vendor.email;

      // 🔍 Check existing vendor dynamically (fix)
      // 🔍 Check existing vendor dynamically
      const existingVendor = await Vendor.findOne({ company_email: emailKey });

      if (existingVendor) {
        // ❌ Don’t update, just skip and record duplicate error
        skipped.push(emailKey);
        updateErrors.push(`Duplicate vendor email found: ${emailKey}`);
        continue; // move to next record
      }

      // ✅ Prevent duplicate username
      if (existingUsernames.has(vendor.username)) {
        skipped.push(emailKey);
        updateErrors.push(`Username already exists: ${vendor.username}`);
        continue;
      }

      try {
        // ✅ Create User
        const defaultPassword = "Vendor@123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const user = await User.create({
          userName: vendor.username,
          email: vendor.email,
          password: hashedPassword,
          roleId: vendorRole._id,
          firstName: vendor.company_name || "Vendor",
          lastName: "",
          isActive: true,
        });

        // ✅ Create Vendor linked with user
        await Vendor.create({
          userId: user._id,
          whatsapp_number: vendor.whatsapp_number,
          vendor_linkedin_profile: vendor.vendor_linkedin_profile,
          company_name: vendor.company_name,
          company_email: vendor.company_email || vendor.email,
          company_phone_number: vendor.company_phone_number,
          company_location: vendor.company_location,
          company_type: vendor.company_type?.toLowerCase() || "",
          hire_resources: vendor.hire_resources?.toLowerCase() || "",
          company_strength: vendor.company_strength,
          company_linkedin_profile: vendor.company_linkedin_profile,
          company_website: vendor.company_website,
          type: "vendor",
        });


        inserted.push(emailKey);
      } catch (err) {
        console.error(`❌ Vendor insert failed for ${emailKey}:`, err.message);
        skipped.push(emailKey);
        updateErrors.push(`Failed to create vendor for ${emailKey}: ${err.message}`);
      }
    }

    fs.unlinkSync(req.file.path);

    return HandleResponse(res, true, StatusCodes.OK, "Vendor import completed", {
      inserted,
      updated,
      skipped,
      updateErrors,
    });
  } catch (err) {
    console.error("Unexpected error during vendor import:", err);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Unexpected error during vendor import"
    );
  }
};

export const exportVendorCsv = async (req, res) => {
  try {
    if (req.user?.role !== Enum.ADMIN) {
      return HandleResponse(res, false, StatusCodes.UNAUTHORIZED, "Only admin can export vendors");
    }

    const { ids, fields } = req.body;

    let vendorQuery = { isDeleted: false };

    if (ids?.length > 0) {
      vendorQuery._id = { $in: ids };
    }

    const vendors = await Vendor.find(vendorQuery).lean();

    if (!vendors.length) {
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, "No vendors found");
    }

    // merge User + Vendor
    const finalData = [];

    for (const v of vendors) {
      const user = await User.findById(v.userId).lean();

      finalData.push({
        vendor: v,
        user: user
      });
    }

    const formattedData = finalData.map(item => ({
      userId: item.user?._id,
      userIdObj: item.user,

      userId: item.user?._id,
      userName: item.user?.userName,
      email: item.user?.email,
      firstName: item.user?.firstName,
      lastName: item.user?.lastName,

      whatsapp_number: item.vendor.whatsapp_number,
      vendor_linkedin_profile: item.vendor.vendor_linkedin_profile,
      company_name: item.vendor.company_name,
      company_email: item.vendor.company_email,
      company_phone_number: item.vendor.company_phone_number,
      company_location: item.vendor.company_location,
      company_type: item.vendor.company_type,
      hire_resources: item.vendor.hire_resources,
      company_strength: item.vendor.company_strength,
      company_linkedin_profile: item.vendor.company_linkedin_profile,
      company_website: item.vendor.company_website,
    }));

    const csv = generateVendorCsv(formattedData, fields);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=vendors_export.csv");

    return res.status(StatusCodes.OK).send(csv);

  } catch (error) {
    console.error("Vendor CSV Export Error:", error);
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to export vendor CSV");
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
      type, // vendor or client
    } = req.query;

    // ✅ Validate type
    if (!["vendor", "client"].includes(type)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Invalid type. Use ?type=vendor or ?type=client"
      );
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    // ✅ Base Query
    const query = {
      isDeleted: false,
      type: type, // 👈 dynamically filter based on ?type=
    };

    // ✅ Optional Filters
    if (company_type) query.company_type = company_type;
    if (hire_resources) query.hire_resources = hire_resources;
    if (company_name)
      query.company_name = { $regex: new RegExp(company_name, "i") };
    if (company_location)
      query.company_location = { $regex: new RegExp(company_location, "i") };
    if (email) query.email = { $regex: new RegExp(email, "i") };

    // ✅ Global Search
    if (search && typeof search === "string") {
      const searchFields = [
        "company_name",
        "email",
        "company_email",
        "company_phone_number",
        "company_location",
        "vendor_linkedin_profile",
      ];

      const searchResults = await commonSearch(
        Vendor,
        searchFields,
        search,
        search,
        pageNum,
        limitNum,
        query // 👈 includes vendor/client filter
      );

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `${type.charAt(0).toUpperCase() + type.slice(1)} list fetched successfully`,
        searchResults
      );
    }

    // ✅ Paginated Result
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
      `${type.charAt(0).toUpperCase() + type.slice(1)} list fetched successfully`,
      results
    );
  } catch (error) {
    console.error("❌ Failed to fetch vendor/client list:", error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to fetch ${req.query.type} list. ${error.message}`
    );
  }
};

