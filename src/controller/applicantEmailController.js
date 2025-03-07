import {
  removeManyEmails,
  createEmail,
} from '../services/applicantEmailService.js';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';
import applicantEmail from '../models/applicantEmailModel.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';

export const sendEmail = async (req, res) => {
  try {
    const { email_to, email_bcc, subject, description } = req.body;

    if (!email_to || (Array.isArray(email_to) && email_to.length === 0)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        "Recipient email list is required."
      );
    }

    const recipients = Array.isArray(email_to) ? email_to : [email_to];

    await sendingEmail({ email_to: recipients, email_bcc, subject, description });

    const storedEmails = recipients.map(email => ({
      email_to: email,
      email_bcc: email_bcc || [],
      subject,
      description,
    }));

    const insertedEmails = await createEmail(storedEmails);

    logger.info(Message.MAIL_SENT);
    return HandleResponse(res, true, StatusCodes.CREATED, Message.MAIL_SENT);
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

export const getAllEmails = async (req, res) => {
  try {
    const { page = 1, limit = 10, email_to, subject, startDate, endDate  } = req.query;

    const numOfpage = parseInt(page) || 1;
    const limitOfRec = parseInt(limit) || 10;

    let query = {};

    if (email_to) {
      query.email_to = { $regex: email_to, $options: 'i' };
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const findEmails = await pagination({
      Schema: applicantEmail,
      page: numOfpage,
      limit: limitOfRec,
      query: query,
      sort: { createdAt: -1 }
    });

    logger.info(`All emails are ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `All emails are ${Message.FETCH_SUCCESSFULLY}`,
      findEmails
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch all emails.`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch all emails.`
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

    logger.info(`Email is ${Message.DELETED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Email is ${Message.DELETED_SUCCESSFULLY}`,
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