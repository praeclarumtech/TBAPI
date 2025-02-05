import Joi from 'joi';
import { Enum } from '../utils/enum.js';

  export const registerValidation= Joi.object().keys({
    userName: Joi.string().required().empty().messages({
      'string.base': `username should be a type of 'text'`,
      'string.empty': `username cannot be an empty field`,
      'any.required': `username is a required field`,
    }),
    email: Joi.string().required().empty().email().messages({
      'string.base': `Email id should be a type of 'text'`,
      'string.empty': `Email id cannot be an empty field`,
      'string.email': `Email id should be in correct format`,
      'any.required': `Email id is required`,
    }),
    password: Joi.string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#'\'()*+,-./:;<=>?@[\]^_`'])[A-Za-z\d@$!%*?&#'\'()*+,-./:;<=>?@[\]^_`']{8,}$/,
        'password'
      )
      .empty()
      .required()
      .min(8)
      .messages({
        'string.base': `Password should be a type of 'text'`,
        'string.empty': `Password cannot be an empty field`,
        'string.min': 'Password length must be at least 8 characters.',
        'any.required': `Password is Required`,
        'string.pattern.name':
          'Password must contain a capital letter, a special character and a digit. Password length must be minimum 8 characters.',
      }),
      // password: Joi.string()
      // .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
      // .required(),
      role: Joi.string()
      .required()
      .valid(Enum.ADMIN, Enum.HR)
      .empty()
      .messages({
        'string.base': `Role should be number`,
        'any.only': `Role must be a ${Enum.ADMIN} or ${Enum.HR}`,
        'string.empty': `Role cannot be an empty field`,
        'any.required': `Role is a required field`,
      }),
  })

  export const loginValidation= Joi.object().keys({
    email: Joi.string().required().empty().email().messages({
      'string.base': `Email id should be a type of 'text'`,
      'string.email': `Email id should be in correct format`,
      'string.empty': `Email id cannot be an empty field`,
      'any.required': `Email id is required`,
    }),
    password: Joi.string().required().empty().messages({
      'string.base': `Password should be a type of 'text'`,
      'string.empty': `Password cannot be an empty field`,
      'any.required': `Password is a required field`,
    }),
  })

