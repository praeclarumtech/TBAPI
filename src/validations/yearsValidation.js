const Joi = require("joi");
// const ObjectId = require('mongoose').Types.ObjectId
// const passingYear = require('../models/passingYear')


const validateId = Joi.object({
    yearId: Joi.number()
        .integer()
        .required()
        .strict()
        .messages({
            "number.base": "Year must be a number",
            "number.integer": "Year must be an integer",
            "number.required": "Year is required",
            "number.min": "passout year  must after 2017",
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

// const validatePassingYear = (req, res, next) => {
//     const { error } = passingYearValidation.validate(req.body)
//     if (error) {
//         return res.status(400).json({
//             error: error.stack
//         })
//     }
//     next()
// }

// const isValidObjectId = async (req, res, next) => {
//     const yearId = req.params.id; 

//     if (!ObjectId.isValid(yearId) || String(new ObjectId(yearId)) !== yearId) {
//         return res.status(400).json({ error: "Invalid ObjectId format" });
//     }
//     try {
//         const details = await passingYear.findById(yearId);
//         if (!details) {
//             return res.status(404).json({ error: "Year not found" });
//         }
//         next();
//     } catch (err) {
//         return res.status(500).json({ error: "Database error" });
//     }
// };

    module.exports = {passingYearValidation,validateId };
