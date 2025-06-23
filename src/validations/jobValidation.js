import Joi from 'joi';
import { applicantEnum, applicationsEnum, jodTypeEnum, salaryFrequencyEnum, timeZome } from '../utils/enum.js';

export const createJobValidation = Joi.object().keys({
    job_subject: Joi.string().required().min(2).messages({
        'string.base': 'Subject must be a string',
        'any.required': 'Subject is required'
    }),
    job_details: Joi.string().required().messages({
        'string.base': 'Details must be a string',
        'any.required': 'Details are required',
    }),
    job_type: Joi.string()
        .valid(jodTypeEnum.CONTRACT, jodTypeEnum.FREELANCE, jodTypeEnum.FULL_TIME, jodTypeEnum.PART_TIME, jodTypeEnum.INTERNSHIP,)
        .required()
        .messages({
            'any.only': `Job Type must be ${jodTypeEnum.CONTRACT},${jodTypeEnum.FREELANCE},${jodTypeEnum.FULL_TIME},${jodTypeEnum.PART_TIME} or ${jodTypeEnum.INTERNSHIP}.`,
            'any.required': 'Job Type is required',
        }),
    time_zone: Joi.string()
        .valid(timeZome.EST, timeZome.IST, timeZome.UTC)
        .required().messages({
            'any.only': `Time-Zone must be ${timeZome.EST},${timeZome.IST} or ${timeZome.UTC}`,
            'any.required': 'Time-Zone  is required',
        }),
    start_time: Joi.string().required().messages({
        'string.base': 'Start Time must be a string',
        'any.required': 'Start Time is required',
    }),
    end_time: Joi.string().required().messages({
        'string.base': 'End Time must be a string',
        'any.required': 'End Time is required',
    }),
    min_salary: Joi.number().required().messages({
        'number.base': 'Min Salary must be a number',
        'any.required': 'Min Salary is required',
    }),
    max_salary: Joi.number().greater(Joi.ref('min_salary')).required().messages({
        'number.base': 'Max Salary must be a number',
        'number.greater': 'Max Salary must be greater than Min Salary',
        'any.required': 'Max Salary is required',
    }),
    contract_duration: Joi.string().required().messages({
        'string.base': 'Contract Duration must be a string',
        'any.required': 'Contract Duration is required',
    }),
    salary_currency: Joi.string().default('INR').messages({
        'string.base': 'Salary Currency must be a string',
    }),
    salary_frequency: Joi.string()
        .valid(...Object.values(salaryFrequencyEnum))
        .optional()
        .messages({
            'any.only': `Salary Frequency must be one of ${Object.values(salaryFrequencyEnum).join(', ')}.`,
        }),
    min_experience: Joi.number().optional().messages({
        'number.base': 'Min Experience must be a number',
    }),
    work_preference: Joi.string()
        .valid(applicantEnum.REMOTE, applicantEnum.HYBRID, applicantEnum.ONSITE, '')
        .optional()
        .messages({
            'any.only': `Work Preference must be ${applicantEnum.REMOTE}, ${applicantEnum.HYBRID}, ${applicantEnum.ONSITE}, or empty.`,
        }),
    required_skills: Joi.array().items(Joi.string()).optional().messages({
        'array.base': 'Required Skills must be an array of strings',
    })
});

export const jobApplicationStatusValidation = Joi.object({
  status: Joi.string()
    .valid(applicationsEnum.SUBMITTED,applicationsEnum.INTERVIEW)
    .required()
    .messages({
      'any.only': 'Invalid application status value.',
      'any.required': 'Status is required.',
    }),
});