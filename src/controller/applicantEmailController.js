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
    const { email_to, email_bcc, subject, date, description } = req.body;

    await sendingEmail({ email_to, email_bcc, subject, date, description });

    const storedEmail = await createEmail({
      email_to,
      email_bcc,
      subject,
      description,
      date,
    });

    logger.info(Message.MAIL_SENT);
    return HandleResponse(res, true, StatusCodes.CREATED, Message.MAIL_SENT);
  } catch (error) {
    console.error('Error occurred:', error.message);
    logger.error(Message.SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} Send mail.`
    );
  }
};

export const getAllEmails = async (req, res) => {
  try {
    const { page = 1, limit = 10, email_to, date, subject } = req.body;

    const numOfpage = parseInt(page) || 1;
    const limitOfRec = parseInt(limit) || 10;

    let query = {};

    if (email_to) {
      query.email_to = { $regex: email_to, $options: 'i' };
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (date) {
      query.date = date;
    }

    const findEmails = await pagination({
      Schema: applicantEmail,
      page: numOfpage,
      limit: limitOfRec,
      query: query,
    });

    logger.info(Message.SHOW_ALL_EMAILS);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.SHOW_ALL_EMAILS,
      findEmails
    );
  } catch (error) {
    logger.error(Message.SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO}  find all emails.`
    );
  }
};

export const deleteManyEmails = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      logger.warn(Message.OBJ_ID_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.OBJ_ID_NOT_FOUND
      );
    }
    
    const removeEmails = await removeManyEmails(ids);

    if (removeEmails.deletedCount === 0) {
      logger.warn(Message.EMAIL_NOT_FOUND);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        Message.EMAIL_NOT_FOUND
      );
    }

    logger.info(Message.EMAIL_DELETED);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.EMAIL_DELETED,
      removeEmails
    );
  } catch (error) {
    logger.error(Message.SERVER_ERROR);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} deleteMany emails.`
    );
  }
};
