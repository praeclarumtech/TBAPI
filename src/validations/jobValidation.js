import Joi from 'joi';

export const createJobValidation = Joi.object().keys({
    job_subject: Joi.string().required().min(5).messages({
        'string.base': 'Subject must be a string',
        'any.required': 'Subject is required'
    }),
    job_details: Joi.string().required().messages({
        'string.base': 'Details must be a string',
        'any.required': 'Details are required',
    }),
    job_type: Joi.string()
        .valid('full-time', 'part-time', 'contract', 'internship', 'freelance')
        .required()
        .messages({
            'any.only': 'Job Type must be one of full-time, part-time, contract, internship, or freelance',
            'any.required': 'Job Type is required',
        }),
    time_zone: Joi.string().required().messages({
        'any.only': 'Time-Zone must ne one of IST,UTC,EST',
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
});