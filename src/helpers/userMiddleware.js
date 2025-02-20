import jwt from 'jsonwebtoken';
import { Message } from '../utils/constant/message.js';
import { HandleResponse } from './handleResponse.js'
import { StatusCodes } from 'http-status-codes';
import logger from '../loggers/logger.js';

export const authorization = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return HandleResponse(
      res,
      false,
      StatusCodes.UNAUTHORIZED,
      Message.NO_TOKEN
    )
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(Message.TOKEN_IS_NOT_VALID)
    return HandleResponse(
      res,
      false,
      StatusCodes.UNAUTHORIZED,
      Message.TOKEN_IS_NOT_VALID
    )
  }
};