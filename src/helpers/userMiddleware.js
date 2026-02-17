import jwt from 'jsonwebtoken';
import { Message } from '../utils/constant/message.js';
import { StatusCodes } from 'http-status-codes';
import logger from '../loggers/logger.js';
import { HandleResponse } from './handleResponse.js';

/**
 * Parse EXPIRES_IN env (e.g. '5h', '24h', '7d') to seconds.
 */
function parseExpiresInToSeconds(expiresIn) {
  const raw = (expiresIn || '24h').toString().replace(/^['"]|['"]$/g, '').trim();
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 24 * 60 * 60; // default 24h in seconds
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'h').toLowerCase();
  const multipliers = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 };
  return value * (multipliers[unit] || 3600);
}

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

    // Sliding session: extend expiry when user is active (renew if less than half the window remains)
    const expiresInEnv = (process.env.EXPIRES_IN || '24h').toString().replace(/^['"]|['"]$/g, '').trim();
    const expiresInSeconds = parseExpiresInToSeconds(process.env.EXPIRES_IN);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = (decoded.exp || 0) - nowSeconds;
    const renewThresholdSeconds = Math.floor(expiresInSeconds / 2);

    logger.debug(`[Auth] userId=${decoded.id} token expires in ${remainingSeconds}s (renew if < ${renewThresholdSeconds}s)`);

    if (remainingSeconds < renewThresholdSeconds && remainingSeconds > 0) {
      const newToken = jwt.sign(
        {
          id: decoded.id,
          role: decoded.role,
          accessModules: decoded.accessModules || [],
        },
        process.env.JWT_SECRET,
        { expiresIn: expiresInEnv }
      );
      res.setHeader('X-New-Token', newToken);
      res.setHeader('X-Token-Expires-In', expiresInEnv);
      res.locals.newToken = newToken; // so response body can include it for frontend
      logger.debug(`[Auth] Sliding session: new token issued for userId=${decoded.id}, expiresIn=${expiresInEnv}`);
    }

    // Inject newToken into JSON response body so frontend can update token without reading headers
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.locals.newToken && body && typeof body === 'object' && body.success && body.newToken === undefined) {
        body = { ...body, newToken: res.locals.newToken };
      }
      return originalJson(body);
    };

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
