import { candidateTemplateType } from '../utils/enum.js';
import Joi from 'joi';
 
export const emailTemplateValidation = Joi.object({
  type: Joi.string()
    .valid(...Object.values(candidateTemplateType))
    .required()
    .messages({
      'any.only': 'Invalid template type',
      'any.required': 'Template type is required'
    }),
  subject: Joi.string().required().messages({
    'string.empty': 'Subject is required',
    'any.required': 'Subject is required'
  }),
  body: Joi.string().required().messages({
    'string.empty': 'Body is required',
    'any.required': 'Body is required'
  })
});