import Joi from 'joi';
import { skillGroupEnum } from '../utils/enum.js';

export const skillsValidation = Joi.object({
  skills: Joi.string().required().messages({
    'string.base': 'Skill must be a string.',
    'string.empty': 'Skill cannot be empty.',
    'any.required': 'Skill is required.',
  }),
  category: Joi.string()
    .valid(...Object.values(skillGroupEnum))
    .required()
    .messages({
      'string.base': 'Category must be a string.',
      'any.only': `Invalid category. Allowed values: ${Object.values(skillGroupEnum).join(', ')}.`,
      'string.empty': 'Category cannot be empty.',
      'any.required': 'Category is required.',
    }),

});
