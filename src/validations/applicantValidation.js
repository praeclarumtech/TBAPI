import Joi from "joi";
import { applicantEnum } from "../utils/enum.js";

export const applicantValidation = Joi.object({
  name: Joi.object({
    first: Joi.string().required().messages({
      "string.base": "First name must be a string.",
      "string.empty": "First name cannot be empty.",
      "any.required": "First name is required.",
    }),
    middle: Joi.string().allow(null, "").messages({
      "string.base": "Middle name must be a string.",
    }),
    last: Joi.string().required().messages({
      "string.base": "Last name must be a string.",
      "string.empty": "Last name cannot be empty.",
      "any.required": "Last name is required.",
    }),
  }).required(),

  phone: Joi.object({
    whatsApp: Joi.string().required().messages({
      "string.base": "WhatsApp number must be a string.",
      "string.empty": "WhatsApp number cannot be empty.",
      "any.required": "WhatsApp number is required.",
    }),
    contact: Joi.string().required().messages({
      "string.base": "Contact number must be a string.",
      "string.empty": "Contact number cannot be empty.",
      "any.required": "Contact number is required.",
    }),
  }).required(),

  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string.",
    "string.email": "Invalid email format.",
    "any.required": "Email is required.",
  }),

  gender: Joi.string()
    .valid(applicantEnum.MALE, applicantEnum.FEMALE, applicantEnum.OTHER)
    .required()
    .messages({
      "any.only": "Gender must be Male, Female, or Other.",
      "any.required": "Gender is required.",
    }),

  dob: Joi.date().required().messages({
    "date.base": "Date of birth must be a valid date.",
    "any.required": "Date of birth is required.",
  }),

  qualification: Joi.string().required().messages({
    "string.empty": "Qualification cannot be empty.",
    "any.required": "Qualification is required.",
  }),

  degree: Joi.string().required().messages({
    "string.empty": "Degree cannot be empty.",
    "any.required": "Degree is required.",
  }),

  passingYear: Joi.number().integer().required().messages({
    "number.base": "Passing Year must be a number.",
    "any.required": "Passing Year is required.",
  }),

  currentLocation: Joi.string().required().messages({
    "string.empty": "Current location cannot be empty.",
    "any.required": "Current location is required.",
  }),

  state: Joi.string().required(),
  country: Joi.string().required(),
  pincode: Joi.number().integer().required(),
  city: Joi.string().required(),

  appliedSkills: Joi.array().items(Joi.string()).required().messages({
    "array.base": "Applied skills must be an array of strings.",
    "any.required": "Applied skills are required.",
  }),

  resume: Joi.string().required().messages({
    "string.empty": "Resume cannot be empty.",
    "any.required": "Resume is required.",
  }),

  totalExp: Joi.number().required().messages({
    "number.base": "Total experience must be a number.",
    "any.required": "Total experience is required.",
  }),

  relevantExp: Joi.number().required().messages({
    "number.base": "Relevant experience must be a number.",
    "any.required": "Relevant experience is required.",
  }),

  otherSkills: Joi.string().allow(null, ""),

  javascriptRate: Joi.number().required().messages({
    "number.base": "JavaScript rate must be a number.",
    "any.required": "JavaScript rate is required.",
  }),

  currentPkg: Joi.string().required(),
  expectedPkg: Joi.string().required(),
  noticePeriod: Joi.string().required(),
  negotiable: Joi.string().required(),

  readyWfo: Joi.string()
    .valid(applicantEnum.YES, applicantEnum.NO)
    .required()
    .messages({
      "any.only": "Ready WFO must be Yes or No.",
      "any.required": "Ready WFO is required.",
    }),

  workPreference: Joi.string()
    .valid(applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE)
    .required()
    .messages({
      "any.only": "Work Preference must be Remote, Hybrid, or Onsite.",
      "any.required": "Work Preference is required.",
    }),

  aboutUs: Joi.string().required(),
  feedback: Joi.string().allow(null, ""),

  status: Joi.string()
    .valid(
      applicantEnum.PENDING,
      applicantEnum.SELECTED,
      applicantEnum.REJECTED,
      applicantEnum.ON_HOLD,
      applicantEnum.IN_PROCESS
    )
    .default(applicantEnum.PENDING)
    .required()
    .messages({
      "any.only": "Invalid status value.",
      "any.required": "Status is required.",
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
    .required()
    .messages({
      "any.only": "Invalid interview stage value.",
      "any.required": "Interview stage is required.",
    }),

  referral: Joi.string().allow(null, ""),
});
