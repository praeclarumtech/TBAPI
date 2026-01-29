import jwt from 'jsonwebtoken';
import { Message } from '../utils/constant/message.js';
import { StatusCodes } from 'http-status-codes';
import logger from '../loggers/logger.js';
import { HandleResponse } from './handleResponse.js';

export const authorization = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      logger.error(Message.NO_TOKEN);
      return HandleResponse(
        res,
        false,
        StatusCodes.UNAUTHORIZED,
        Message.NO_TOKEN
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Check if token is expired
    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired');
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Session expired. Please login again.',
        sessionExpired: true, // Flag for frontend to detect session expiration
        expiredAt: error.expiredAt,
        code: 'SESSION_EXPIRED', // Error code for frontend handling
      });
    }

    // Check if token is invalid for other reasons
    if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token format.');
      return HandleResponse(
        res,
        false,
        StatusCodes.UNAUTHORIZED,
        Message.TOKEN_IS_NOT_VALID
      );
    }

    // Generic error
    logger.error(Message.TOKEN_IS_NOT_VALID, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.UNAUTHORIZED,
      Message.TOKEN_IS_NOT_VALID
    );
  }
};

export const verifyRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        statusCode: StatusCodes.FORBIDDEN,
        message: `${Message.ACCESS_DENIED} you do not have permission to access this resource.`,
      });
    }
    next();
  };
};
