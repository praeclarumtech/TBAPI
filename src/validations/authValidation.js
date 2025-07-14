import { Enum } from '../utils/enum.js';
import { combinedValidation, registerValidation } from './userValidation.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';

export const validateUserRegistration = (req, res, next) => {
    const isAdminCreateVendor = req.user
        ? req.user.role === Enum.ADMIN && req.body.role === Enum.VENDOR
        : false;
    const schema = isAdminCreateVendor ? combinedValidation : registerValidation;

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map((err) => err.message);
        return HandleResponse(res, false, StatusCodes.BAD_REQUEST, errors);
    }
    next();
};
