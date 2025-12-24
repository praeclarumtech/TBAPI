import {
  getSettings,
  getSettingsWithTemplates,
  updateSettings,
  updateDateTimeSettings,
  updateEmailTemplateVisibility,
  getVisibleTemplatesForContext,
} from '../services/settingsService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { clearCacheByPrefixes } from '../helpers/commonFunction/cacheUtils.js';

// Get all settings (with email templates from EmailTemplate table)
export const getAllSettings = async (req, res) => {
  try {
    const settings = await getSettingsWithTemplates();

    logger.info(`Settings ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Settings ${Message.FETCH_SUCCESSFULLY}`,
      settings
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch settings.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch settings.`
    );
  }
};

// Update all settings
export const updateAllSettings = async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user?._id;

    const updatedSettings = await updateSettings(updateData, userId);

    clearCacheByPrefixes(['settings']);
    logger.info(`Settings ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Settings ${Message.UPDATED_SUCCESSFULLY}`,
      updatedSettings
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update settings.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update settings.`
    );
  }
};

// Update date & time settings only
export const updateDateTime = async (req, res) => {
  try {
    const { dateFormat, timeFormat, timezone } = req.body;
    const userId = req.user?._id;

    const updatedSettings = await updateDateTimeSettings(
      { dateFormat, timeFormat, timezone },
      userId
    );

    clearCacheByPrefixes(['settings']);
    logger.info(`Date & Time settings ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Date & Time settings ${Message.UPDATED_SUCCESSFULLY}`,
      updatedSettings
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} update date & time settings.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update date & time settings.`
    );
  }
};

// Update email template visibility
export const updateTemplateVisibility = async (req, res) => {
  try {
    const { emailTemplateVisibility } = req.body;
    const userId = req.user?._id;

    if (!emailTemplateVisibility || !Array.isArray(emailTemplateVisibility)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Email template visibility array is required'
      );
    }

    const updatedSettings = await updateEmailTemplateVisibility(
      emailTemplateVisibility,
      userId
    );

    clearCacheByPrefixes(['settings']);
    logger.info(`Email template visibility ${Message.UPDATED_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Email template visibility ${Message.UPDATED_SUCCESSFULLY}`,
      updatedSettings
    );
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} update email template visibility.`,
      error
    );
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} update email template visibility.`
    );
  }
};

// Get visible templates for a specific context
export const getTemplatesForContext = async (req, res) => {
  try {
    const { context } = req.params;
    const validContexts = ['vendor', 'client', 'job', 'qrCode', 'custom'];

    if (!validContexts.includes(context)) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Invalid context. Must be one of: ${validContexts.join(', ')}`
      );
    }

    const visibleTemplates = await getVisibleTemplatesForContext(context);

    logger.info(
      `Visible templates for ${context} ${Message.FETCH_SUCCESSFULLY}`
    );
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Visible templates for ${context} ${Message.FETCH_SUCCESSFULLY}`,
      visibleTemplates
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch visible templates.`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch visible templates.`
    );
  }
};
