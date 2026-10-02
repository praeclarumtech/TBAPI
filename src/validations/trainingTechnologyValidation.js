import Joi from 'joi';

export const trainingTechnologyValidation = Joi.object({
  name: Joi.string().trim().min(1).max(80).required().messages({
    'string.empty': 'Technology name is required.',
    'any.required': 'Technology name is required.',
    'string.max': 'Technology name must be 80 characters or fewer.',
  }),
});
