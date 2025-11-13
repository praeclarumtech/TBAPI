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

        // ✅ Load roles
    const roleData = await Role.findOne({ name: req.body.role });


    if (!roleData) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Vendor or Client role not found in Role collection"
      );
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    // ✅ Parse CSV
    if (ext === ".csv") {
      rows = await new Promise((resolve, reject) => {
        let headers = [];
        const data = [];

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
        role: req.body.role || "",
        whatsapp_number: row.whatsapp_number?.trim() || "",
        company_type: row.company_type?.trim().toLowerCase() || "",
        hire_resources: row.hire_resources?.trim().toLowerCase() || "",
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
      if (!vendor.role) errs.push("role is required (vendor/client)");
      if (!["vendor", "client"].includes(vendor.role)) {
        errs.push(`Invalid role: ${vendor.role}`);
      }
      if (!vendor.whatsapp_number) errs.push("whatsapp_number is required");

      if (!vendor.company_type) {
        errs.push("company_type is required");
      } else if (!Object.values(CompanyTypeEnum).includes(vendor.company_type)) {
        errs.push(`Invalid company_type: ${vendor.company_type}`);
      }

      if (!vendor.hire_resources) {
        errs.push("hire_resources is required");
      } else if (
        !Object.values(HireResourcesEnum).includes(vendor.hire_resources)
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
        duplicateErrors.push(`Line ${line}: Duplicate username (${username}) inside file`);
      }
      seenUsernames.add(username);

      if (seenEmails.has(emailKey)) {
        duplicateErrors.push(`Line ${line}: Duplicate email (${emailKey}) inside file`);
      }
      seenEmails.add(emailKey);

      if (seenPhones.has(phone)) {
        duplicateErrors.push(`Line ${line}: Duplicate whatsapp_number (${phone}) inside file`);
      }
      seenPhones.add(phone);
    });

    if (duplicateErrors.length) {
      fs.unlinkSync(req.file.path);
      return HandleResponse(res, false, StatusCodes.BAD_REQUEST, duplicateErrors);
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
      dbVendors.map((v) => (v.company_email || "").trim().toLowerCase())
    );
    const dbPhones = new Set(
      dbVendors.map((v) => (v.whatsapp_number || "").trim())
    );
    const dbUsernames = new Set(dbUsers.map((u) => u.userName.trim()));

    validVendors.forEach((v, i) => {
      const line = i + 1;
      const emailKey = (v.company_email || v.email).trim().toLowerCase();
      const phone = v.whatsapp_number.trim();
      const username = v.username.trim();

      if (dbEmails.has(emailKey)) {
        dbDupErrors.push(`Line ${line}: Email already exists in DB (${emailKey})`);
      }
      if (dbPhones.has(phone)) {
        dbDupErrors.push(`Line ${line}: whatsapp_number already exists in DB (${phone})`);
      }
      if (dbUsernames.has(username)) {
        dbDupErrors.push(`Line ${line}: Username already exists in DB (${username})`);
      }
    });

    if (dbDupErrors.length && updateFlag !== true) {
      fs.unlinkSync(req.file.path);

      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        "Duplicate records found. Do you want to update?",
        {
          existingEmails: [...dbEmails],
        }
      );
    }

    const inserted = [];
    const updated = [];
    const skipped = [];
    const updateErrors = [];

    for (const vendor of validVendors) {
      const emailKey = (vendor.company_email || vendor.email).trim().toLowerCase();
      const phone = vendor.whatsapp_number.trim();
      const username = vendor.username.trim();

      const existingVendor = await Vendor.findOne({
        $or: [
          { company_email: emailKey },
          { whatsapp_number: phone },
        ],
      });

      const existingUser = await User.findOne({ userName: username });

      if (existingVendor && updateFlag === true) {
        try {
          await Vendor.updateOne(
            { _id: existingVendor._id },
            {
              whatsapp_number: vendor.whatsapp_number,
              vendor_linkedin_profile: vendor.vendor_linkedin_profile,
              company_name: vendor.company_name,
              company_phone_number: vendor.company_phone_number,
              company_location: vendor.company_location,
              company_type: vendor.company_type,
              hire_resources: vendor.hire_resources,
              company_strength: vendor.company_strength,
              company_linkedin_profile: vendor.company_linkedin_profile,
              company_website: vendor.company_website,
            }
          );

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
        const hashedPassword = await bcrypt.hash("Vendor@123", 10);

        const user = await User.create({
          userName: vendor.username,
          email: vendor.email,
          password: hashedPassword,
          roleId,
          firstName: vendor.company_name || vendor.role.toUpperCase(),
          lastName: "",
          isActive: true,
        });

        await Vendor.create({
          userId: user._id,
          whatsapp_number: vendor.whatsapp_number,
          vendor_linkedin_profile: vendor.vendor_linkedin_profile,
          company_name: vendor.company_name,
          company_email: vendor.company_email || vendor.email,
          company_phone_number: vendor.company_phone_number,
          company_location: vendor.company_location,
          company_type: vendor.company_type,
          hire_resources: vendor.hire_resources,
          company_strength: vendor.company_strength,
          company_linkedin_profile: vendor.company_linkedin_profile,
          company_website: vendor.company_website,
          type: vendor.role,
        });

        inserted.push(emailKey);
      } catch (err) {
        skipped.push(emailKey);
        updateErrors.push(`Failed to create ${emailKey}: ${err.message}`);
      }
    }

    fs.unlinkSync(req.file.path);

    return HandleResponse(res, true, StatusCodes.OK, "Import completed", {
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
      "Unexpected error during import"
    );
  }
};

export const exportVendorCsv = async (req, res) => {
  try {
    // ✅ Only admin can export
    if (req.user?.role !== Enum.ADMIN) {
      return HandleResponse(
        res,
        false,
        StatusCodes.UNAUTHORIZED,
        "Only admin can export vendor/client data"
      );
    }

    // ✅ Read from body
    const { role, ids, fields } = req.body;
    const roleType = role?.toLowerCase();

    // ✅ Validate role
    if (!["vendor", "client"].includes(roleType)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Invalid role. Use role='vendor' or role='client'"
      );
    }

    // ✅ Query vendor/client data
    const query = { isDeleted: false, type: roleType };
    if (ids?.length > 0) {
      query._id = { $in: ids };
    }

    const vendorClientRecords = await Vendor.find(query).lean();
    if (!vendorClientRecords.length) {
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `No ${roleType} records found`
      );
    }

    // ✅ Combine User + Vendor/Client info
    const combinedData = [];
    for (const record of vendorClientRecords) {
      const user = await User.findById(record.userId).lean();

      combinedData.push({
        userId: user?._id?.toString() || "",
        username: user?.userName || "",
        email: user?.email || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        role: roleType, // ✅ include role directly
        whatsapp_number: record.whatsapp_number || "",
        company_name: record.company_name || "",
        company_email: record.company_email || "",
        company_phone_number: record.company_phone_number || "",
        company_location: record.company_location || "",
        company_type: record.company_type || "",
        hire_resources: record.hire_resources || "",
        company_strength: record.company_strength || "",
        company_linkedin_profile: record.company_linkedin_profile || "",
        company_website: record.company_website || "",
        vendor_linkedin_profile: record.vendor_linkedin_profile || "",
      });
    }

    // ✅ Generate CSV using your helper
    const csv = generateVendorCsv(combinedData, fields);

    // ✅ Send CSV as file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${roleType}_export.csv`
    );

    return res.status(StatusCodes.OK).send(csv);
  } catch (error) {
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to export vendor/client CSV"
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

    const query = {
      isDeleted: false,
      type,
    };

    if (company_type) query.company_type = company_type;
    if (hire_resources) query.hire_resources = hire_resources;

    if (company_name)
      query.company_name = { $regex: new RegExp(company_name, "i") };

    if (company_location)
      query.company_location = { $regex: new RegExp(company_location, "i") };

    if (email)
      query.email = { $regex: new RegExp(email, "i") };

    if (company_email)
      query.company_email = { $regex: new RegExp(company_email, "i") };

    if (vendor_linkedin_profile)
      query.vendor_linkedin_profile = {
        $regex: new RegExp(vendor_linkedin_profile, "i"),
      };

    if (company_phone_number) {
      const rangeMatch = company_phone_number
        .toString()
        .match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        query.company_phone_number = { $gte: min, $lte: max };
      } else {
        query.company_phone_number = company_phone_number;
      }
    }

    if (company_strength) {
      const rangeMatch = company_strength
        .toString()
        .match(/^(\d+)-(\d+)$/);

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
        query.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
      if (endDate)
        query.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }

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
        query
      );

      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        `${type.charAt(0).toUpperCase() + type.slice(1)} list fetched successfully`,
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
      `${type.charAt(0).toUpperCase() + type.slice(1)} list fetched successfully`,
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


