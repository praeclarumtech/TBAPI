import Joi from "joi"

export const validateId = Joi.object({
    id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            "string.base": "YearId must be a string",
            "string.pattern.base": "YearId must be a valid MongoDB ObjectId",
            "any.required": "YearId is required",
        })
});

export const passingYearValidation = Joi.object({
    year: Joi.number()
        .integer()
        .min(1999)
        .required()
        .strict()
        .messages({
            "number.base": "Year must be a number",
            "number.integer": "Year must be an integer",
            "number.required": "Year is required",
            "number.min": "passout year  must after 2017",
        })
});



