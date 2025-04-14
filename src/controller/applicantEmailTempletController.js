import {
    createEmailTemplate,
    getEmailTemplateById,
    updateEmailTemplate,
    deleteEmailTemplate,
    getAllEmailTemplates
  } from '../services/emailTemplateService.js';
  import { HandleResponse } from '../helpers/handleResponse.js';
  import { StatusCodes } from 'http-status-codes';
  import logger from '../loggers/logger.js';
   
  export const createEmailTemplateController = async (req, res) => {
    try {
   
      const { type, subject, body } = req.body;
   
      const template = await createEmailTemplate({ type, subject, body });
   
      return HandleResponse(
        res,
        true,
        StatusCodes.CREATED,
        'Email template created successfully.',
        template
      );
    } catch (error) {
      logger.error(`Failed to create email template: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  };
   
  export const viewEmailTemplateController = async (req, res) => {
    try {
      const { id } = req.params;
   
      const template = await getEmailTemplateById(id);
   
      if (!template) {
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          'Email template not found.'
        );
      }
   
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email template fetched successfully.',
        template
      );
    } catch (error) {
      logger.error(`Failed to view email template: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  };
   
  export const updateEmailTemplateController = async (req, res) => {
    try {
   
      const { id } = req.params;
      const { type, subject, body } = req.body;
   
      const template = await updateEmailTemplate(id, { type, subject, body });
   
      if (!template) {
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          'Email template not found.'
        );
      }
   
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email template updated successfully.',
        template
      );
    } catch (error) {
      logger.error(`Failed to update email template: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  };
   
  export const deleteEmailTemplateController = async (req, res) => {
    try {
      const { id } = req.params;
   
      const template = await deleteEmailTemplate(id);
   
      if (!template) {
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          'Email template not found.'
        );
      }
   
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email template deleted successfully.',
        template
      );
    } catch (error) {
      logger.error(`Failed to delete email template: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  };
   
  export const getAllEmailTemplatesController = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
   
      const templates = await getAllEmailTemplates(page, limit);
   
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email templates fetched successfully.',
        templates
      );
    } catch (error) {
      logger.error(`Failed to get all email templates: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  };