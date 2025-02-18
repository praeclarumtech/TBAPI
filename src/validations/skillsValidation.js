import Joi from 'joi';

export const skillsValidation = Joi.object({
  skills: Joi.string().required().messages({
    'string.base': 'Skill must be a string.',
    'string.empty': 'Skill cannot be empty.',
    'any.required': 'Skill is required.',
  }),

});
