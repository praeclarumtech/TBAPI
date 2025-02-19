import Joi from 'joi';

export const sendEmailValidation = Joi.object().keys({
  email_to: Joi.string().required().email().messages({
    'string.base': `Email id should be a type of 'text'`,
    'string.empty': `Email id cannot be an empty field`,
    'string.email': `Email id should be in correct format`,
    'any.required': `Email id is required`,
  }),
  email_bcc: Joi.string().required().email().messages({
    'string.base': `Email bcc should be a type of 'text'`,
    'string.empty': `Email bcc cannot be an empty field`,
    'string.email': `Email bcc should be in correct format`,
    'any.required': `Email bcc is required`,
  }),
  subject: Joi.string().required().min(1).max(100).messages({
    'string.empty': `Subject cannot be an empty field`,
    'string.min': `Subject should be at least 1 character long`,
    'string.max': `Subject should not exceed 100 characters`,
  }),
  description: Joi.string().required().min(1).max(500).messages({
    'string.empty': `Description cannot be an empty field`,
    'string.min': `Description should be at least 1 character long`,
    'string.max': `Description should not exceed 500 characters`,
  }),
  date: Joi.date().iso().max('now').required().messages({
    'date.base': 'Date must be a valid date.',
    'date.max': 'Date cannot be in the future.',
    'any.required': 'Date is required.',
  }),
});
