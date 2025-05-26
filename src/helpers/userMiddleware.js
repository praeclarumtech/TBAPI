import jwt from 'jsonwebtoken';
import { Message } from '../utils/constant/message.js';
import { StatusCodes } from 'http-status-codes';
import logger from '../loggers/logger.js';
 
export const authorization = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
 
    if (!token) {
      logger.error(message.NO_TOKEN);
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: Message.NO_TOKEN,
      });
    }
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(Message.TOKEN_IS_NOT_VALID);
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: Message.TOKEN_IS_NOT_VALID,
    });
  }
};
 
 