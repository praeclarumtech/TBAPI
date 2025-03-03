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
  subject: Joi.string().required(),
  description: Joi.string().allow('').optional(),
});
