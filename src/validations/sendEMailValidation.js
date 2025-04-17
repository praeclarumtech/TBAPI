import Joi from 'joi';

export const sendEmailValidation = Joi.object().keys({
  email_to: Joi.alternatives().try(
    Joi.string()
      .email()
      .required()
      .messages({
        "string.email": "Email_to should be in a valid email format",
      }),
    Joi.array()
      .items(
        Joi.string()
          .email()
          .required()
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one recipient email is required",
        "string.email": "Each email in the list should be valid",
      })
  ),
    email_bcc: Joi.array()
    .items(
      Joi.string().allow('')
        .email({ tlds: { allow: false } })
    )
    .optional()
    .messages({
      'array.base': `"email_bcc" must be an array`,
    }),
    subject: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      path: Joi.string().required(),
    })
  )
});
