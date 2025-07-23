import Joi from 'joi';
import { CompanyTypeEnum, Enum, HireResourcesEnum } from '../utils/enum.js';

export const registerValidation = Joi.object().keys({
  userName: Joi.string().alphanum().min(3).max(30).required().messages({
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
  isActive: Joi.boolean().optional().messages({
    'boolean.base': `isActive must be true or false`,
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
  firstName: Joi.string().allow(null, '').messages({
    'string.base': 'First name must be a string.',
    'string.empty': 'First name cannot be empty.',
    'any.required': 'First name is required.',
  }),
  lastName: Joi.string().allow(null, '').messages({
    'string.base': 'Last name must be a string.',
    'string.empty': 'Last name cannot be empty.',
    'any.required': 'Last name is required.',
  }),

  role: Joi.string()
    .required()
    .valid(Enum.ADMIN, Enum.HR, Enum.VENDOR, Enum.GUEST,Enum.CLIENT)
    .messages({
      'string.base': `Role should be number`,
      'any.only': `Role must be a ${Enum.ADMIN},${Enum.VENDOR},${Enum.HR},${Enum.CLIENT}, or ${Enum.GUEST}`,
      'string.empty': `Role cannot be an empty field`,
      'any.required': `Role is a required field`,
    }),
});

export const vendorValidation = Joi.object().keys({
  whatsapp_number: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Whatsapp number must be a valid mobile number with country code',
    }),

  vendor_linkedin_profile: Joi.string().uri().required().messages({
    'string.uri': 'Vendor LinkedIn profile must be a valid URL',
  }),

  company_name: Joi.string().required(),

  company_email: Joi.string().email().required().messages({
    'string.email': 'Company email should be a valid email address',
  }),

  company_phone_number: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Company phone number must be a valid mobile number with country code',
    }),

  company_location: Joi.string().required(),

  company_type: Joi.string()
    .valid(
      CompanyTypeEnum.PRODUCT,
      CompanyTypeEnum.SERVICE,
      CompanyTypeEnum.BOTH
    )
    .required()
    .messages({
      'any.only': `Company type must be one of ${Object.values(
        CompanyTypeEnum
      ).join(', ')}`,
    }),

  hire_resources: Joi.string()
    .valid(
      HireResourcesEnum.C2C,
      HireResourcesEnum.C2H,
      HireResourcesEnum.IN_HOUSE,
      HireResourcesEnum.ALL
    )
    .required()
    .messages({
      'any.only': `Hire resources must be one of ${Object.values(
        HireResourcesEnum
      ).join(', ')}`,
    }),

  company_strength: Joi.string().required(),

  company_linkedin_profile: Joi.string().uri().required().messages({
    'string.uri': 'Company LinkedIn profile must be a valid URL',
  }),

  company_website: Joi.string().uri().required().messages({
    'string.uri': 'Company website must be a valid URL',
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

export const combinedValidation = registerValidation.concat(vendorValidation)