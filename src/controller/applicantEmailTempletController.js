import {
    createEmailTemplate,
    getEmailTemplateById,
    updateEmailTemplate,
    deleteEmailTemplate,
    getAllEmailTemplates,
    getEmailTemplateByStatus
  } from '../services/emailTemplateService.js';
  import { HandleResponse } from '../helpers/handleResponse.js';
  import { StatusCodes } from 'http-status-codes';
  import logger from '../loggers/logger.js';
  import EmailTemplate from '../models/emailTemplateModel.js';
   
  export const createEmailTemplateController = async (req, res) => {
    try {
   
      const { type, subject, description } = req.body;
   
      const template = await createEmailTemplate({ type, subject, description });
   
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
      const { type, subject, description } = req.body;
   
      const template = await updateEmailTemplate(id, { type, subject, description });
   
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
  
      const result = await deleteEmailTemplate(id);
  
      if (!result) {
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
        result
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      const totalRecords = await EmailTemplate.countDocuments({ isDeleted: false });
      const templates = await getAllEmailTemplates(page, limit);
      const totalPages = Math.ceil(totalRecords / limit);
  
      return HandleResponse(
        res,
        true,
        StatusCodes.OK,
        'Email templates fetched successfully.',
        {
          templates,
          pagination: {
            totalRecords,
            currentPage: page,
            totalPages,
            limit
          }
        }
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

  export const getEmailTemplateByStatusController = async (req, res) => {
    try {
      const { type } = req.params;
  
      const template = await getEmailTemplateByStatus(type);
  
      if (!template) {
        return HandleResponse(
          res,
          false,
          StatusCodes.NOT_FOUND,
          'Email template not found for the provided type.'
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
      logger.error(`Failed to get email template by type: ${error.message}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  };