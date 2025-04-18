import Joi from 'joi';
import { applicantEnum, genderEnum } from '../utils/enum.js';

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
    .valid(genderEnum.MALE, genderEnum.FEMALE, genderEnum.OTHER)
    .required()
    .messages({
      'any.only': 'Gender must be male, female, or other.',
      'any.required': 'Gender is required.',
    }),
  dateOfBirth: Joi.date().required().messages({
    'date.base': 'Date of birth must be a valid date.',
    'any.required': 'Date of birth is required.',
  }),

  qualification: Joi.string().required().messages({
    'string.empty': 'Qualification cannot be empty.',
    'any.required': 'Qualification are required.',
  }),

  specialization: Joi.string().required().messages({
    'string.empty': 'specialization cannot be empty.',
    'any.required': 'specialization is required.',
  }),

  passingYear: Joi.number().integer().required().messages({
    'number.base': 'Passing Year must be a number.',
    'any.required': 'Passing Year is required.',
  }),

  currentAddress: Joi.string().required().messages({
    'string.empty': 'Current Address cannot be empty.',
    'any.required': 'Current Address is required.',
  }),
  state: Joi.string().required(),
  country: Joi.string().required(),
  currentPincode: Joi.number().integer().allow(null, ''),
  currentCity: Joi.string().required(),
  resumeUrl: Joi.string(),
  practicalUrl: Joi.string().allow(''),
  portfolioUrl: Joi.string().allow(''),
  linkedinUrl: Joi.string().allow(''),
  clientCvUrl: Joi.string().allow(''),
  clientFeedback: Joi.string().allow(''),

  appliedSkills: Joi.array().items(Joi.string()).required().messages({
    'array.base': 'Applied skills must be an array of strings.',
    'any.required': 'Applied skills are required.',
  }),

  totalExperience: Joi.number().allow(null, '').messages({
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

  currentPkg: Joi.number().allow(null, ''),
  expectedPkg: Joi.number().allow(null, ''),
  noticePeriod: Joi.number().allow(''),
  negotiation: Joi.string().required(),

  workPreference: Joi.string()
    .valid(applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE)
    .required()
    .messages({
      'any.only': 'Work Preference must be remote, hybrid, or onsite.',
      'any.required': 'Work Preference is required.',
    }),

  currentCompanyDesignation: Joi.string()
    .valid(
      applicantEnum.SOFTWARE_ENGINEER,
      applicantEnum.WEB_DESIGNER,
      applicantEnum.WEB_DEVELOPER,
      applicantEnum.FRONTED_DEVLOPER,
      applicantEnum.SENIOR_FRONTED_DEVLOPER,
      applicantEnum.SENIOR_SOFTWARE_ENGINEER,
      applicantEnum.APPLICATION_DEVELOPMENT_MODERNIZATION,
      applicantEnum.BACKEND_DEVLOPER,
      applicantEnum.JUNIOR_SOFTWARE_ENGINEER,
      applicantEnum.FULL_STACK_DEVLOPER,
      applicantEnum.BLOCKCHAIN_DEVELOPER,
      applicantEnum.DATA_ANALYST,
      applicantEnum.DATA_SCIENTIST,
      applicantEnum.PRODUCT_MANAGER,
      applicantEnum.PROJECT_ENGINEER,
      applicantEnum.UI_UX,
      applicantEnum.QA,
      applicantEnum.DEVOPS,
      applicantEnum.BUSNESS_ANALYST,
      applicantEnum.TECHNICSL_SUPPORT,
      applicantEnum.MERN_STACK_DEVELOPER,
      applicantEnum.JUNIOR_MERN_STACK_DEVELOPER,
      applicantEnum.MEAN_STACK_DEVELOPER,
      applicantEnum.APPLICATION_DEVELOPER,
      applicantEnum.DOTNET_DEVELOPER,
      applicantEnum.JUNIOR_DOTNET_DEVELOPER,
      applicantEnum.JAVA_DEVELOPER,
      applicantEnum.PYTHON_DEVELOPER,
      applicantEnum.PHP_DEVELOPER,
      applicantEnum.SPECIALIST_PROGRAMMER,
      applicantEnum.REACT_DEVELOPER,
      applicantEnum.REACT_NATIVE_DEVELOPER,
      applicantEnum.NODEJS_DEVELOPER,
      applicantEnum.SENIOR_JAVSCRIPT_DEVELOPER,
      applicantEnum.ASSOCIATE_SOFTWARE_ENGINEER,
      applicantEnum.ASSOCIATE_PROCESS_MANAGER,
      applicantEnum.QUALITY_ANALYST,
      applicantEnum.FREELANCER,
      applicantEnum.TEAM_LEADER,
      applicantEnum.TECHNICAL_ANALYST,
      applicantEnum.FRESHER,
      applicantEnum.SENIOR_ANGULAR_DEVELOPER,
      applicantEnum.SHAREPOINT_DEVELOPER,
      applicantEnum.PLACEMENT_EXECUTIVE,
      applicantEnum.SENIOR_UI_ENGINEER,
      applicantEnum.SYSTEM_ENGINEER,
      applicantEnum.SENIOR_SYSTEM_ENGINEER,
      applicantEnum.PROGRAMER_ANALYST,
      applicantEnum.CUSTOMER_SUPPORT_SPECIALIST,
      applicantEnum.SENIOR_DOTNET_DEVELOPER,
      applicantEnum.OTHER,
      applicantEnum.NA,
    )
    .messages({
      'any.required': 'CurrentCompanyDesignation is required.',
    }),

  comment: Joi.string().allow(null, ''),
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
      applicantEnum.FIRST_INTERVIEW_ROUND,
      applicantEnum.CLIENT,
      applicantEnum.PRACTICAL
    )
    .default(applicantEnum.FIRST_INTERVIEW_ROUND)
    .messages({
      'any.only': 'Invalid interview stage value.',
      'any.required': 'Interview stage is required.',
    }),
  preferredLocations: Joi.string().allow(''),
  currentCompanyName: Joi.string().allow(''),
  maritalStatus: Joi.string()
    .valid('', applicantEnum.SINGLE, applicantEnum.MARRIED, '')
    .optional()
    .messages({
      'any.only': 'Maritial status must be Single,or Married.',
    }),
  lastFollowUpDate: Joi.date().allow('').messages({
    'date.base': 'lastFollowUpDate must be a valid date.',
  }),
  appliedRole: Joi.string().required(),
  permanentAddress: Joi.string().allow(null, ''),
  anyHandOnOffers: Joi.boolean(),
  referral: Joi.string().allow(null, ''),
  collegeName: Joi.string().allow(null, ''),
  cgpa: Joi.number().allow(''),
  meta: Joi.object().default({}).messages({
    'object.base': 'Meta must be an object with key-value pairs.',
  }),
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
    .valid(genderEnum.MALE, genderEnum.FEMALE, genderEnum.OTHER)
    .messages({
      'any.only': 'Gender must be male, female, or other.',
    }),

  dateOfBirth: Joi.date().messages({
    'date.base': 'Date of birth must be a valid date.',
    'any.required': 'Date of birth is required.',
  }),

  qualification: Joi.string().messages({
    'string.base': 'Qualification must be a string.',
  }),

  specialization: Joi.string().messages({
    'string.empty': 'specialization cannot be empty.',
  }),

  passingYear: Joi.number().integer().messages({
    'number.base': 'Passing Year must be a number.',
  }),

  currentAddress: Joi.string().messages({
    'string.empty': 'Current Address cannot be empty.',
  }),
  state: Joi.string().allow(null, ''),
  country: Joi.string().allow(null, ''),
  currentPincode: Joi.number().integer().allow(null, ''),
  currentCity: Joi.string().allow(null, ''),
  url: Joi.string(),
  resumeUrl: Joi.string(),

  appliedSkills: Joi.array().items(Joi.string()).messages({
    'array.base': 'Applied skills must be an array of strings.',
  }),

  totalExperience: Joi.number().allow(null, '').messages({
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

  currentPkg: Joi.number().allow(null, ''),
  expectedPkg: Joi.number().allow(null, ''),
  noticePeriod: Joi.number().allow(''),
  negotiation: Joi.string().allow(''),

  workPreference: Joi.string()
    .valid(applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE)
    .messages({
      'any.only': 'Work Preference must be remote, hybrid, or onsite.',
    }),

  currentCompanyDesignation: Joi.string()
    .valid(
      applicantEnum.SOFTWARE_ENGINEER,
      applicantEnum.WEB_DESIGNER,
      applicantEnum.WEB_DEVELOPER,
      applicantEnum.FRONTED_DEVLOPER,
      applicantEnum.SENIOR_FRONTED_DEVLOPER,
      applicantEnum.SENIOR_SOFTWARE_ENGINEER,
      applicantEnum.APPLICATION_DEVELOPMENT_MODERNIZATION,
      applicantEnum.BACKEND_DEVLOPER,
      applicantEnum.JUNIOR_SOFTWARE_ENGINEER,
      applicantEnum.FULL_STACK_DEVLOPER,
      applicantEnum.BLOCKCHAIN_DEVELOPER,
      applicantEnum.DATA_ANALYST,
      applicantEnum.DATA_SCIENTIST,
      applicantEnum.PRODUCT_MANAGER,
      applicantEnum.PROJECT_ENGINEER,
      applicantEnum.UI_UX,
      applicantEnum.QA,
      applicantEnum.DEVOPS,
      applicantEnum.BUSNESS_ANALYST,
      applicantEnum.TECHNICSL_SUPPORT,
      applicantEnum.MERN_STACK_DEVELOPER,
      applicantEnum.JUNIOR_MERN_STACK_DEVELOPER,
      applicantEnum.MEAN_STACK_DEVELOPER,
      applicantEnum.APPLICATION_DEVELOPER,
      applicantEnum.DOTNET_DEVELOPER,
      applicantEnum.JUNIOR_DOTNET_DEVELOPER,
      applicantEnum.JAVA_DEVELOPER,
      applicantEnum.PYTHON_DEVELOPER,
      applicantEnum.PHP_DEVELOPER,
      applicantEnum.SPECIALIST_PROGRAMMER,
      applicantEnum.REACT_DEVELOPER,
      applicantEnum.REACT_NATIVE_DEVELOPER,
      applicantEnum.NODEJS_DEVELOPER,
      applicantEnum.SENIOR_JAVSCRIPT_DEVELOPER,
      applicantEnum.ASSOCIATE_SOFTWARE_ENGINEER,
      applicantEnum.ASSOCIATE_PROCESS_MANAGER,
      applicantEnum.QUALITY_ANALYST,
      applicantEnum.FREELANCER,
      applicantEnum.TEAM_LEADER,
      applicantEnum.TECHNICAL_ANALYST,
      applicantEnum.FRESHER,
      applicantEnum.SENIOR_ANGULAR_DEVELOPER,
      applicantEnum.SHAREPOINT_DEVELOPER,
      applicantEnum.PLACEMENT_EXECUTIVE,
      applicantEnum.SENIOR_UI_ENGINEER,
      applicantEnum.SYSTEM_ENGINEER,
      applicantEnum.SENIOR_SYSTEM_ENGINEER,
      applicantEnum.PROGRAMER_ANALYST,
      applicantEnum.CUSTOMER_SUPPORT_SPECIALIST,
      applicantEnum.SENIOR_DOTNET_DEVELOPER,
      applicantEnum.OTHER,
      applicantEnum.NA,
    )
    .messages({
      'any.required': 'CurrentCompanyDesignation is required.',
    }),

  comment: Joi.string().allow(null, ''),
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
      applicantEnum.FIRST_INTERVIEW_ROUND,
      applicantEnum.CLIENT,
      applicantEnum.PRACTICAL
    )
    .default(applicantEnum.FIRST_INTERVIEW_ROUND)
    .messages({
      'any.only': 'Invalid interview stage value.',
      'any.required': 'Interview stage is required.',
    }),

  practicalUrl: Joi.string().allow(''),
  portfolioUrl: Joi.string().allow(''),
  preferredLocations: Joi.string().allow(''),
  currentCompanyName: Joi.string().allow(''),

  maritalStatus: Joi.string()
    .valid('', applicantEnum.SINGLE, applicantEnum.MARRIED, '')
    .optional()
    .messages({
      'any.only': 'Maritial status must be Single,or Married.',
    }),
  lastFollowUpDate: Joi.date().allow('').messages({
    'date.base': 'lastFollowUpDate must be a valid date.',
  }),
  permanentAddress: Joi.string().allow(null, ''),
  anyHandOnOffers: Joi.boolean(),
  referral: Joi.string().allow(null, ''),
  collegeName: Joi.string().allow(null, ''),
  appliedRole: Joi.string()
    .valid(
      applicantEnum.SOFTWARE_ENGINEER,
      applicantEnum.WEB_DESIGNER,
      applicantEnum.WEB_DEVELOPER,
      applicantEnum.FRONTED_DEVLOPER,
      applicantEnum.SENIOR_FRONTED_DEVLOPER,
      applicantEnum.SENIOR_SOFTWARE_ENGINEER,
      applicantEnum.APPLICATION_DEVELOPMENT_MODERNIZATION,
      applicantEnum.BACKEND_DEVLOPER,
      applicantEnum.JUNIOR_SOFTWARE_ENGINEER,
      applicantEnum.FULL_STACK_DEVLOPER,
      applicantEnum.BLOCKCHAIN_DEVELOPER,
      applicantEnum.DATA_ANALYST,
      applicantEnum.DATA_SCIENTIST,
      applicantEnum.PRODUCT_MANAGER,
      applicantEnum.PROJECT_ENGINEER,
      applicantEnum.UI_UX,
      applicantEnum.QA,
      applicantEnum.DEVOPS,
      applicantEnum.BUSNESS_ANALYST,
      applicantEnum.TECHNICSL_SUPPORT,
      applicantEnum.MERN_STACK_DEVELOPER,
      applicantEnum.JUNIOR_MERN_STACK_DEVELOPER,
      applicantEnum.MEAN_STACK_DEVELOPER,
      applicantEnum.APPLICATION_DEVELOPER,
      applicantEnum.DOTNET_DEVELOPER,
      applicantEnum.JUNIOR_DOTNET_DEVELOPER,
      applicantEnum.JAVA_DEVELOPER,
      applicantEnum.PYTHON_DEVELOPER,
      applicantEnum.PHP_DEVELOPER,
      applicantEnum.SPECIALIST_PROGRAMMER,
      applicantEnum.REACT_DEVELOPER,
      applicantEnum.REACT_NATIVE_DEVELOPER,
      applicantEnum.NODEJS_DEVELOPER,
      applicantEnum.SENIOR_JAVSCRIPT_DEVELOPER,
      applicantEnum.ASSOCIATE_SOFTWARE_ENGINEER,
      applicantEnum.ASSOCIATE_PROCESS_MANAGER,
      applicantEnum.QUALITY_ANALYST,
      applicantEnum.FREELANCER,
      applicantEnum.TEAM_LEADER,
      applicantEnum.TECHNICAL_ANALYST,
      applicantEnum.FRESHER,
      applicantEnum.SENIOR_ANGULAR_DEVELOPER,
      applicantEnum.SHAREPOINT_DEVELOPER,
      applicantEnum.PLACEMENT_EXECUTIVE,
      applicantEnum.SENIOR_UI_ENGINEER,
      applicantEnum.SYSTEM_ENGINEER,
      applicantEnum.SENIOR_SYSTEM_ENGINEER,
      applicantEnum.PROGRAMER_ANALYST,
      applicantEnum.CUSTOMER_SUPPORT_SPECIALIST,
      applicantEnum.SENIOR_DOTNET_DEVELOPER,
      applicantEnum.OTHER,
      applicantEnum.NA,
    )
    .messages({
      'any.required': 'CurrentCompanyDesignation is required.',
    }),
  cgpa: Joi.number().allow(''),
  linkedinUrl: Joi.string().allow(''),
  clientCvUrl: Joi.string().allow(''),
  clientFeedback: Joi.string().allow(''),
  meta: Joi.object().optional().messages({
    'object.base': 'Meta must be an object with key-value pairs.',
  }),
});


export const updateManyApplicantsValidation = Joi.object({
  applicantIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
      'string.pattern.base': 'Each applicant ID must be a valid MongoDB ObjectId.',
    }))
    .min(1)
    .required()
    .messages({
      'array.base': 'applicantIds must be an array.',
      'array.min': 'At least one applicant ID is required.',
      'any.required': 'applicantIds is required.',
    }),

  updateData: Joi.object({
    status: Joi.string()
      .valid(
        applicantEnum.PENDING,
        applicantEnum.SELECTED,
        applicantEnum.REJECTED,
        applicantEnum.HOLD,
        applicantEnum.IN_PROCESS
      )
      .messages({ 'any.only': 'Invalid status value.' }),

    interviewStage: Joi.string()
      .valid(
        applicantEnum.HR_ROUND,
        applicantEnum.TECHNICAL,
        applicantEnum.FIRST_INTERVIEW_ROUND,
        applicantEnum.CLIENT,
        applicantEnum.PRACTICAL
      )
      .messages({ 'any.only': 'Invalid interview stage value.' }),

    appliedRole: Joi.string().valid(
      applicantEnum.SOFTWARE_ENGINEER,
      applicantEnum.WEB_DESIGNER,
      applicantEnum.WEB_DEVELOPER,
      applicantEnum.FRONTED_DEVLOPER,
      applicantEnum.SENIOR_FRONTED_DEVLOPER,
      applicantEnum.SENIOR_SOFTWARE_ENGINEER,
      applicantEnum.APPLICATION_DEVELOPMENT_MODERNIZATION,
      applicantEnum.BACKEND_DEVLOPER,
      applicantEnum.JUNIOR_SOFTWARE_ENGINEER,
      applicantEnum.FULL_STACK_DEVLOPER,
      applicantEnum.BLOCKCHAIN_DEVELOPER,
      applicantEnum.DATA_ANALYST,
      applicantEnum.DATA_SCIENTIST,
      applicantEnum.PRODUCT_MANAGER,
      applicantEnum.PROJECT_ENGINEER,
      applicantEnum.UI_UX,
      applicantEnum.QA,
      applicantEnum.DEVOPS,
      applicantEnum.BUSNESS_ANALYST,
      applicantEnum.TECHNICSL_SUPPORT,
      applicantEnum.MERN_STACK_DEVELOPER,
      applicantEnum.JUNIOR_MERN_STACK_DEVELOPER,
      applicantEnum.MEAN_STACK_DEVELOPER,
      applicantEnum.APPLICATION_DEVELOPER,
      applicantEnum.DOTNET_DEVELOPER,
      applicantEnum.JUNIOR_DOTNET_DEVELOPER,
      applicantEnum.JAVA_DEVELOPER,
      applicantEnum.PYTHON_DEVELOPER,
      applicantEnum.PHP_DEVELOPER,
      applicantEnum.SPECIALIST_PROGRAMMER,
      applicantEnum.REACT_DEVELOPER,
      applicantEnum.REACT_NATIVE_DEVELOPER,
      applicantEnum.NODEJS_DEVELOPER,
      applicantEnum.SENIOR_JAVSCRIPT_DEVELOPER,
      applicantEnum.ASSOCIATE_SOFTWARE_ENGINEER,
      applicantEnum.ASSOCIATE_PROCESS_MANAGER,
      applicantEnum.QUALITY_ANALYST,
      applicantEnum.FREELANCER,
      applicantEnum.TEAM_LEADER,
      applicantEnum.TECHNICAL_ANALYST,
      applicantEnum.FRESHER,
      applicantEnum.SENIOR_ANGULAR_DEVELOPER,
      applicantEnum.SHAREPOINT_DEVELOPER,
      applicantEnum.PLACEMENT_EXECUTIVE,
      applicantEnum.SENIOR_UI_ENGINEER,
      applicantEnum.SYSTEM_ENGINEER,
      applicantEnum.SENIOR_SYSTEM_ENGINEER,
      applicantEnum.PROGRAMER_ANALYST,
      applicantEnum.CUSTOMER_SUPPORT_SPECIALIST,
      applicantEnum.SENIOR_DOTNET_DEVELOPER,
      applicantEnum.OTHER,
      applicantEnum.NA,
    ),

    lastFollowUpDate: Joi.date().iso().messages({
      'date.base': 'lastFollowUpDate must be a valid date.',
      'date.format': 'lastFollowUpDate must be in ISO 8601 format.',
    }),
  })
    .required()
    .messages({
      'object.base': 'updateData must be an object.',
      'any.required': 'updateData is required.',
    }),
});


