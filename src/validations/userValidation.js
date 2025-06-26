import Joi from 'joi';
import { Enum } from '../utils/enum.js';

export const registerValidation = Joi.object().keys({
  userName: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': `Username should be a type of 'text'`,
      'string.empty': `Username cannot be an empty field`,
      'string.alphanum': `Username must only contain letters and numbers`,
      'string.min': `Username must be at least 3 characters`,
      'string.max': `Username must be at most 30 characters`,
      'any.required': `Username is a required field`,
    }),
  email: Joi.string().required().email().messages({
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
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'string.base': `Confirm Password should be a type of text`,
    'string.empty': 'Confirm Password is not allowed to be empty',
    // 'any.required': `Confirm Password is Required`,
    'any.only': `Password and confirm password should be same`,
    'string.pattern.name': `Confirm Password must contain a capital letter, a special character and a digit. Password length must be minimum 8 characters.`,
  }),

  role: Joi.string()
    .required()
    .valid(Enum.ADMIN, Enum.HR, Enum.VENDOR, Enum.GUEST)
    .messages({
      'string.base': `Role should be number`,
      'any.only': `Role must be a ${Enum.ADMIN},${Enum.VENDOR},${Enum.HR} or ${Enum.GUEST}`,
      'string.empty': `Role cannot be an empty field`,
      'any.required': `Role is a required field`,
    }),
});

export const loginValidation = Joi.object().keys({
  email: Joi.alternatives()
    .try(
      Joi.string().email().messages({
        'string.email': `Login ID must be a valid email format`,
      }),
      Joi.string().alphanum().min(3).max(30).messages({
        'string.alphanum': `Username must only contain letters and numbers`,
        'string.min': `Username must be at least 3 characters`,
        'string.max': `Username must be at most 30 characters`,
      })
    )
    .required()
    .messages({
      'alternatives.match': `Login ID must be a valid email or username`,
      'any.required': `Login ID is required`,
    }),

  password: Joi.string().required().messages({
    'string.base': `Password should be a type of 'text'`,
    'string.empty': `Password cannot be an empty field`,
    'any.required': `Password is a required field`,
  }),
});


export const sendEmailValidation = Joi.object({
  email: Joi.string().required().email().messages({
    'string.base': `Email id should be a type of 'text'`,
    'string.email': `Email id should be in correct format`,
    'string.empty': `Email id cannot be an empty field`,
    'any.required': `Email id is required`,
  }),
});

export const forgotPasswordValidation = Joi.object({
  email: Joi.string().required().email().messages({
    'string.base': `Email id should be a type of 'text'`,
    'string.email': `Email id should be in correct format`,
    'string.empty': `Email id cannot be an empty field`,
    'any.required': `Email id is required`,
  }),
  newPassword: Joi.string()
    .required()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#'\'()*+,-./:;<=>?@[\]^_`'])[A-Za-z\d@$!%*?&#'\'()*+,-./:;<=>?@[\]^_`']{8,}$/
    )
    .messages({
      'string.base': `Password should be a type of 'text'`,
      'string.empty': `Password cannot be an empty field`,
      'string.min': 'Password length must be at least 8 characters.',
      'any.required': `New password is Required`,
      'string.pattern.name':
        'Password must contain a capital letter, a special character, and a digit. Password length must be a minimum of 8 characters.',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'string.base': `Confirm password should be a type of 'text'`,
      'string.empty': `Confirm Password cannot be an empty field`,
      'any.required': `Confirm Password is required`,
      'any.only': `Password and confirm password must be the same`,
    }),
});

export const changePasswordValidation = Joi.object().keys({
  oldPassword: Joi.string().required().messages({
    'string.base': `Old password should be a type of 'text'`,
    'string.empty': `Old password cannot be an empty field`,
    'any.required': `Old password is a required field`,
  }),
  newPassword: Joi.string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#'\'()*+,-./:;<=>?@[\]^_`'])[A-Za-z\d@$!%*?&#'\'()*+,-./:;<=>?@[\]^_`']{8,}$/,
      'password'
    )
    .required()
    .min(8)
    .messages({
      'string.base': `New Password should be a type of 'text'`,
      'string.empty': `New Password cannot be an empty field`,
      'string.min': 'New Password length must be at least 8 characters.',
      'any.required': `New Password is Required`,
      'string.pattern.name':
        'New Password must contain a capital letter, a special character, and a digit. Password length must be minimum 8 characters.',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'string.base': `Confirm Password should be a type of text`,
      'string.empty': 'Confirm Password is not allowed to be empty',
      'any.required': `Confirm Password is Required`,
      'any.only': `New Password and Confirm Password should be the same`,
    }),
});
