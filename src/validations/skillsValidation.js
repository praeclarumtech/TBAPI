import Joi from 'joi';


export const validateId = Joi.object({
  skillId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'SkillsId must be a string',
      'string.pattern.base': 'SkillsId must be a valid MongoDB ObjectId',
      'any.required': 'SkillsId is required',
    }),
});

export const skillsValidation = Joi.object({
  skills: Joi.string().required().messages({
    'string.base': 'Skill must be a string.',
    'string.empty': 'Skill cannot be empty.',
    'any.required': 'Skill is required.',
  }),
});
