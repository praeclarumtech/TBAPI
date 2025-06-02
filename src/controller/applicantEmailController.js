import {
  removeManyEmails,
  createEmail,
  findAllEmails,
  findEmailById,
  countEmailsByDate
} from '../services/applicantEmailService.js';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import applicantEmail from '../models/applicantEmailModel.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import Applicant from '../models/applicantModel.js';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';

export const sendEmail = async (req, res) => {
  try {
    const { email_to, email_bcc, subject, description } = req.body;

    if (!email_to || (Array.isArray(email_to) && email_to.length === 0)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Recipient email list is required.'
      );
    }

    const recipients = Array.isArray(email_to) ? email_to : [email_to];

    const applicants = await Applicant.find({
      email: { $in: recipients },
    }).select('email isActive');

    const emailsInDB = applicants.map(applicant => applicant.email);

    const activeEmailsFromDB = [];
    const inactiveEmails = [];

applicants.forEach(applicant => {
      if (applicant.isActive) {
        activeEmailsFromDB.push(applicant.email);
      } else {
        inactiveEmails.push(applicant.email);
      }
    });

      const emailsNotInDB = recipients.filter(email => !emailsInDB.includes(email));

    // Final list of emails to send
    const finalEmailsToSend = [...activeEmailsFromDB, ...emailsNotInDB];

    if (finalEmailsToSend.length === 0) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Email not sent. Inactive or no eligible recipients found.'

      );
    }

    const attachments = req.files?.map((file) => ({
      filename: file.originalname,
      path: file.path,
    })) || [];

    // Send email only to active applicants
    await sendingEmail({
      email_to: finalEmailsToSend,
      email_bcc,
      subject,
      description,
      attachments
    });

    const storedEmails = finalEmailsToSend.map((email) => ({
      email_to: email,
      email_bcc: email_bcc || [],
      subject,
      description,
      attachments
    }));

    await createEmail(storedEmails);

    const messageParts = [`Mail sent successfully to: ${finalEmailsToSend.join(', ')}`];

     if (inactiveEmails.length > 0) {
      messageParts.push(
        `Email not sent to inactive applicants: ${inactiveEmails.join(', ')}`
      );
    }

    logger.info(Message.MAIL_SENT);
    return HandleResponse(res, true, StatusCodes.CREATED, messageParts.join('. '));
  } catch (error) {
    logger.error(`${Message.FAILED_TO} send mail.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} send mail. ${error.message}`
    );
  }
};


export const getAllEmails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      search,
    } = req.query;

    const numOfpage = parseInt(page) || 1;
    const limitOfRec = parseInt(limit) || 10;

    let query = {};
    let applicantQuery = {};

    if (search) {
      query.$or = [
        { email_to: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const { emails, totalRecords, totalPages } = await findAllEmails(
      query,
      applicantQuery,
      numOfpage,
      limitOfRec
    );

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All emails are ${Message.FETCH_SUCCESSFULLY}`,
      {
        emails,
        totalRecords,
        totalPages,
        currentPage: numOfpage,
        limit: limitOfRec,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch all emails.${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch all emails.`
    );
  }
};

export const viewEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await findEmailById(id);

    if (!email) {
      logger.warn(`Email ${Message.NOT_FOUND}: ${id}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        `Email ${Message.NOT_FOUND}`
      );
    }

    logger.info(`email ${Message.FETCH_SUCCESSFULLY} `);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `email ${Message.FETCH_SUCCESSFULLY} `,
      { email }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch email by ID.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch email by ID.`
    );
  }
};

export const deleteManyEmails = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(`ObjectId is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OBJ_ID_NOT_FOUND
      );
    }

    const removeEmails = await removeManyEmails(ids);

    if (removeEmails.deletedCount === 0) {
      logger.warn(`Email is ${Message.NOT_FOUND}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Email is ${Message.NOT_FOUND}`
      );
    }

    logger.info(`Email ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Email ${Message.DELETED_SUCCESSFULLY}`,
      removeEmails
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} deleteMany emails.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany emails.`
    );
  }
};

export const getEmailCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (startDate && !endDate) {
      start = new Date(startDate);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    const count = await countEmailsByDate(start, end);

    logger.info(`Email count ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Email count ${Message.FETCH_SUCCESSFULLY}`,
      {count}
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} get email count.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} get email count.`
    );
  }
};

