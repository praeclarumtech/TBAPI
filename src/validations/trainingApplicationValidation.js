import Joi from 'joi';
import {
  genderEnum,
  trainingApplicantTypeEnum,
  trainingDurationValues,
  trainingInterestValues,
  trainingSemesterValues,
} from '../utils/enum.js';

export const trainingApplicationValidation = Joi.object({
  name: Joi.object({
    firstName: Joi.string().trim().required().messages({
      'string.empty': 'First name is required.',
      'any.required': 'First name is required.',
    }),
    middleName: Joi.string().trim().allow('', null),
    lastName: Joi.string().trim().required().messages({
      'string.empty': 'Last name is required.',
      'any.required': 'Last name is required.',
    }),
  }).required(),
  countryCode: Joi.string().trim().default('+91'),
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Contact number must be a valid 10-digit Indian mobile number.',
      'string.empty': 'Contact number is required.',
      'any.required': 'Contact number is required.',
    }),
  email: Joi.string().trim().email().allow('', null).messages({
    'string.email': 'Enter a valid email id.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }).required(),
  technology: Joi.alternatives()
    .try(
      Joi.array().max(1).items(Joi.string().trim().allow('')),
      Joi.string().trim().allow('', null)
    )
    .optional(),
  interestedFor: Joi.string()
    .valid(...trainingInterestValues)
    .required()
    .messages({
      'any.only': 'Select online, offline, or hybrid.',
      'any.required': 'Select online, offline, or hybrid.',
    }),
  qualification: Joi.string().trim().allow('', null),
  collegeName: Joi.string().trim().allow('', null),
  semester: Joi.string()
    .valid(...trainingSemesterValues, '')
    .allow(null),
  duration: Joi.string()
    .valid(...trainingDurationValues)
    .required()
    .messages({
      'any.only': 'Select a valid training duration.',
      'any.required': 'Duration is required.',
    }),
  gender: Joi.string()
    .valid(genderEnum.MALE, genderEnum.FEMALE, genderEnum.OTHER)
    .required()
    .messages({
      'any.only': 'Gender must be male, female, or other.',
      'any.required': 'Gender is required.',
    }),
  applicantType: Joi.string()
    .valid(...Object.values(trainingApplicantTypeEnum))
    .required()
    .messages({
      'any.only': 'Select student, employee, or other.',
      'any.required': 'Applicant type is required.',
    }),
  state: Joi.string().trim().allow('', null),
  city: Joi.string().trim().allow('', null),
  address: Joi.string().trim().allow('', null),
});
