import Joi from 'joi';

export const degreeValidation = Joi.object({
    degree: Joi.string().required().messages({
        'string.base': 'Degree must be a string.',
        'string.empty': 'Degree cannot be empty.',
        'any.required': 'Degree is required.',
    }),

});
