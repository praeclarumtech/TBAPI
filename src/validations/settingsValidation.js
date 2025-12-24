import Joi from 'joi';

// Date & Time settings validation
export const dateTimeValidation = Joi.object({
  dateFormat: Joi.string()
    .valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY/MM/DD')
    .optional(),
  timeFormat: Joi.string().valid('12', '24').optional(),
  timezone: Joi.string()
    .valid(
      'IST',
      'UTC',
      'EST',
      'PST',
      'CST',
      'MST',
      'GMT',
      'CET',
      'EET',
      'JST',
      'AEST'
    )
    .optional(),
});

// Template visibility item validation
const templateVisibilityItemSchema = Joi.object({
  templateType: Joi.string().required(),
  vendor: Joi.boolean().default(false),
  client: Joi.boolean().default(false),
  job: Joi.boolean().default(false),
  qrCode: Joi.boolean().default(false),
  custom: Joi.boolean().default(false),
});

// Email template visibility validation
export const emailTemplateVisibilityValidation = Joi.object({
  emailTemplateVisibility: Joi.array()
    .items(templateVisibilityItemSchema)
    .required(),
});

// Full settings validation
export const settingsValidation = Joi.object({
  dateFormat: Joi.string()
    .valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY/MM/DD')
    .optional(),
  timeFormat: Joi.string().valid('12', '24').optional(),
  timezone: Joi.string()
    .valid(
      'IST',
      'UTC',
      'EST',
      'PST',
      'CST',
      'MST',
      'GMT',
      'CET',
      'EET',
      'JST',
      'AEST'
    )
    .optional(),
  emailTemplateVisibility: Joi.array()
    .items(templateVisibilityItemSchema)
    .optional(),
});
