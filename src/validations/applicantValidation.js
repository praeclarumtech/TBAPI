import Joi from 'joi';
import { applicantEnum } from '../utils/enum.js';

export const applicantValidation = Joi.object({
  name: Joi.object({
    firstName: Joi.string().required().messages({
      'string.base': 'First name must be a string.',
      'string.empty': 'First name cannot be empty.',
      'any.required': 'First name is required.',
    }),
    middleName: Joi.string().allow(null, '').messages({
      'string.base': 'Middle name must be a string.',
    }),
    lastName: Joi.string().required().messages({
      'string.base': 'Last name must be a string.',
      'string.empty': 'Last name cannot be empty.',
      'any.required': 'Last name is required.',
    }),
  }).required(),

  phone: Joi.object({
    whatsappNumber: Joi.string().required().messages({
      'string.base': 'WhatsApp number must be a string.',
      'string.empty': 'WhatsApp number cannot be empty.',
      'any.required': 'WhatsApp number is required.',
    }),
    phoneNumber: Joi.string().required().messages({
      'string.base': 'Contact number must be a string.',
      'string.empty': 'Contact number cannot be empty.',
      'any.required': 'Contact number is required.',
    }),
  }).required(),

  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Invalid email format.',
    'any.required': 'Email is required.',
  }),

  gender: Joi.string()
    .valid(applicantEnum.MALE, applicantEnum.FEMALE, applicantEnum.OTHER)
    .required()
    .messages({
      'any.only': 'Gender must be male, female, or other.',
      'any.required': 'Gender is required.',
    }),

  dateOfBirth: Joi.date().required().messages({
    'date.base': 'Date of birth must be a valid date.',
    'any.required': 'Date of birth is required.',
  }),

  qualification: Joi.array().items(Joi.string()).required().messages({
    'array.base': 'Qualification must be an array of strings.',
    'any.required': 'Qualification are required.',
  }),

  degree: Joi.string().required().messages({
    'string.empty': 'Degree cannot be empty.',
    'any.required': 'Degree is required.',
  }),

  passingYear: Joi.number().integer().required().messages({
    'number.base': 'Passing Year must be a number.',
    'any.required': 'Passing Year is required.',
  }),

  currentLocation: Joi.string().messages({
    'string.empty': 'Current location cannot be empty.',
    'any.required': 'Current location is required.',
  }),
  fullAddress: Joi.string().required(),

  state: Joi.string().required(),
  country: Joi.string().required(),
  pincode: Joi.number().integer().required(),
  city: Joi.string().required(),
  resumeUrl: Joi.string(),
  practicalUrl: Joi.string(),
  portfolioUrl: Joi.string(),

  appliedSkills: Joi.array().items(Joi.string()).required().messages({
    'array.base': 'Applied skills must be an array of strings.',
    'any.required': 'Applied skills are required.',
  }),

  resume: Joi.string().messages({
    'string.empty': 'Resume cannot be empty.',
    'any.required': 'Resume is required.',
  }),

  totalExperience: Joi.number().required().messages({
    'number.base': 'Total experience must be a number.',
    'any.required': 'Total experience is required.',
  }),

  communicationSkill: Joi.number().required().messages({
    'number.base': 'Communication Skill must be a number.',
    'any.required': 'Communication Skill is required.',
  }),

  relevantSkillExperience: Joi.number().required().messages({
    'number.base': 'Relevant experience must be a number.',
    'any.required': 'Relevant experience is required.',
  }),

  otherSkills: Joi.string().allow(null, ''),

  rating: Joi.number().required().messages({
    'number.base': 'JavaScript rate must be a number.',
    'any.required': 'JavaScript rate is required.',
  }),

  currentPkg: Joi.string().allow(null, ''),
  expectedPkg: Joi.string().allow(null, ''),
  noticePeriod: Joi.string().required(),
  negotiation: Joi.string().required(),

  readyForWork: Joi.string()
    .valid(applicantEnum.YES, applicantEnum.NO)
    .messages({
      'any.only': 'Ready WFO must be yes or no.',
      'any.required': 'Ready WFO is required.',
    }),

  workPreference: Joi.string()
    .valid(applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE)
    .required()
    .messages({
      'any.only': 'Work Preference must be remote, hybrid, or onsite.',
      'any.required': 'Work Preference is required.',
    }),

  CurrentCompanyDesignation: Joi.string()
    .valid(
      applicantEnum.FRONTED_DEVLOPER,
      applicantEnum.SOFTWARE_ENGINNER,
      applicantEnum.BACKEND_DEVLOPER,
      applicantEnum.FULL_STACK_DEVLOPER,
      applicantEnum.DATA_ANALYST,
      applicantEnum.DATA_SCIENTIST,
      applicantEnum.PRODUCT_MANAGER,
      applicantEnum.UI_UX,
      applicantEnum.QA,
      applicantEnum.DEVOPS,
      applicantEnum.BUSNESS_ANALYST,
      applicantEnum.TECHNICSL_SUPPORT,
      applicantEnum.OTHER
    )
    .required()
    .messages({
      'any.required': 'CurrentCompanyDesignation is required.',
    }),

  aboutUs: Joi.string().allow(null, ''),
  feedback: Joi.string().allow(null, ''),
  practicalFeedback: Joi.string().allow(null, ''),

  status: Joi.string()
    .valid(
      applicantEnum.PENDING,
      applicantEnum.SELECTED,
      applicantEnum.REJECTED,
      applicantEnum.HOLD,
      applicantEnum.IN_PROCESS
    )
    .default(applicantEnum.PENDING)
    .messages({
      'any.only': 'Invalid status value.',
      'any.required': 'Status is required.',
    }),

  interviewStage: Joi.string()
    .valid(
      applicantEnum.HR_ROUND,
      applicantEnum.TECHNICAL,
      applicantEnum.FIRST_INTERVIEW,
      applicantEnum.SECOND_INTERVIEW,
      applicantEnum.FINAL
    )
    .default(applicantEnum.HR_ROUND)
    .messages({
      'any.only': 'Invalid interview stage value.',
      'any.required': 'Interview stage is required.',
    }),

  PreferredLocations: Joi.string(),
  CurrentCompanyName: Joi.string(),
  MaritalStatus: Joi.string()
    .valid(applicantEnum.SINGAL, applicantEnum.MARRIED)
    .messages({
      'any.only': 'Work Preference must be Singal, hybrid, or Married.',
    }),
  lastFollowUpDate: Joi.date().messages({
    'date.base': 'Date of birth must be a valid date.',
  }),
  HomeTownCity: Joi.string(),

  referral: Joi.string().allow(null, ''),
});

export const updateApplicantValidation = Joi.object({
  name: Joi.object({
    firstName: Joi.string().messages({
      'string.base': 'First name must be a string.',
      'string.empty': 'First name cannot be empty.',
    }),
    middleName: Joi.string().allow(null, '').messages({
      'string.base': 'Middle name must be a string.',
    }),
    lastName: Joi.string().messages({
      'string.base': 'Last name must be a string.',
      'string.empty': 'Last name cannot be empty.',
    }),
  }),

  phone: Joi.object({
    whatsappNumber: Joi.string().messages({
      'string.base': 'WhatsApp number must be a string.',
      'string.empty': 'WhatsApp number cannot be empty.',
    }),
    phoneNumber: Joi.string().messages({
      'string.base': 'Contact number must be a string.',
      'string.empty': 'Contact number cannot be empty.',
    }),
  }),

  email: Joi.string().email().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Invalid email format.',
  }),

  gender: Joi.string()
    .valid(applicantEnum.MALE, applicantEnum.FEMALE, applicantEnum.OTHER)
    .messages({
      'any.only': 'Gender must be male, female, or other.',
    }),

  dateOfBirth: Joi.date().messages({
    'date.base': 'Date of birth must be a valid date.',
  }),

  qualification: Joi.array().items(Joi.string()).messages({
    'array.base': 'Qualification must be an array of strings.',
  }),

  degree: Joi.string().messages({
    'string.empty': 'Degree cannot be empty.',
  }),

  passingYear: Joi.number().integer().messages({
    'number.base': 'Passing Year must be a number.',
  }),

  currentLocation: Joi.string().messages({
    'string.empty': 'Current location cannot be empty.',
  }),
  fullAddress: Joi.string(),

  state: Joi.string(),
  country: Joi.string(),
  pincode: Joi.number().integer(),
  city: Joi.string(),
  url: Joi.string(),

  appliedSkills: Joi.array().items(Joi.string()).messages({
    'array.base': 'Applied skills must be an array of strings.',
  }),

  resume: Joi.string().messages({
    'string.empty': 'Resume cannot be empty.',
  }),

  totalExperience: Joi.number().messages({
    'number.base': 'Total experience must be a number.',
  }),

  communicationSkill: Joi.number().messages({
    'number.base': 'Communication Skill must be a number.',
  }),

  relevantSkillExperience: Joi.number().messages({
    'number.base': 'Relevant experience must be a number.',
  }),

  otherSkills: Joi.string().allow(null, ''),

  rating: Joi.number().messages({
    'number.base': 'JavaScript rate must be a number.',
  }),

  currentPkg: Joi.string().allow(null, ''),
  expectedPkg: Joi.string().allow(null, ''),
  noticePeriod: Joi.string(),
  negotiation: Joi.string(),

  readyForWork: Joi.string()
    .valid(applicantEnum.YES, applicantEnum.NO)
    .messages({
      'any.only': 'Ready WFO must be yes or no.',
    }),

  workPreference: Joi.string()
    .valid(applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE)
    .messages({
      'any.only': 'Work Preference must be remote, hybrid, or onsite.',
    }),

  CurrentCompanyDesignation: Joi.string()
    .valid(
      applicantEnum.FRONTED_DEVLOPER,
      applicantEnum.SOFTWARE_ENGINNER,
      applicantEnum.BACKEND_DEVLOPER,
      applicantEnum.FULL_STACK_DEVLOPER,
      applicantEnum.DATA_ANALYST,
      applicantEnum.DATA_SCIENTIST,
      applicantEnum.PRODUCT_MANAGER,
      applicantEnum.UI_UX,
      applicantEnum.QA,
      applicantEnum.DEVOPS,
      applicantEnum.BUSNESS_ANALYST,
      applicantEnum.TECHNICSL_SUPPORT,
      applicantEnum.OTHER
    )
    .messages({
      'any.required': 'CurrentCompanyDesignation is required.',
    }),

  aboutUs: Joi.string().allow(null, ''),
  feedback: Joi.string().allow(null, ''),
  practicalFeedback: Joi.string().allow(null, ''),

  status: Joi.string()
    .valid(
      applicantEnum.PENDING,
      applicantEnum.SELECTED,
      applicantEnum.REJECTED,
      applicantEnum.HOLD,
      applicantEnum.IN_PROCESS
    )
    .default(applicantEnum.PENDING)
    .messages({
      'any.only': 'Invalid status value.',
    }),

  interviewStage: Joi.string()
    .valid(
      applicantEnum.HR_ROUND,
      applicantEnum.TECHNICAL,
      applicantEnum.FIRST_INTERVIEW,
      applicantEnum.SECOND_INTERVIEW,
      applicantEnum.FINAL
    )
    .default(applicantEnum.HR_ROUND)
    .messages({
      'any.only': 'Invalid interview stage value.',
      'any.required': 'Interview stage is required.',
    }),

  practicalUrl: Joi.string(),
  portfolioUrl: Joi.string(),
  PreferredLocations: Joi.string(),
  CurrentCompanyName: Joi.string(),
  MaritalStatus: Joi.string()
    .valid(applicantEnum.SINGAL, applicantEnum.MARRIED)
    .messages({
      'any.only': 'Work Preference must be Singal, hybrid, or Married.',
    }),
  lastFollowUpDate: Joi.date().messages({
    'date.base': 'Date of birth must be a valid date.',
  }),
  HomeTownCity: Joi.string(),

  referral: Joi.string().allow(null, ''),
});
