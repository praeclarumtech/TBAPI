const Joi = require("joi");

const validateId = Joi.object({
    id: Joi.number()
        .integer()
        .required()
        .messages({
            "number.base": "YearId must be a number",
            "number.integer": "YearId must be an integer",
            "any.required": "YearId is required",
        })
});

const passingYearValidation = Joi.object({
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

module.exports = {passingYearValidation,validateId };
