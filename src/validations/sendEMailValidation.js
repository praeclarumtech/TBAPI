import Joi from 'joi';

export const sendEmailValidation = Joi.object().keys({
  email_to: Joi.string()
    .required()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      'string.pattern.base': `Email_to should be in the correct format`,
    }),
  email_bcc: Joi.string()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      'string.pattern.base': `Email_bcc should be in the correct format`,
    }),
  subject: Joi.string().required().min(1).max(100).messages({
    'string.empty': `Subject cannot be an empty field`,
    'string.min': `Subject should be at least 1 character long`,
    'string.max': `Subject should not exceed 100 characters`,
  }),
  description: Joi.string().optional().min(1).max(500).messages({
    'string.min': `Description should be at least 1 character long`,
    'string.max': `Description should not exceed 500 characters`,
  }),
});
