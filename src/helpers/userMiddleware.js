import jwt from 'jsonwebtoken';
import { Message } from '../utils/constant/message.js';
import { StatusCodes } from 'http-status-codes';
import logger from '../loggers/logger.js';
import { HandleResponse } from './handleResponse.js';


function parseDurationToSeconds(duration) {
  const raw = (duration || '').toString().replace(/^['"]|['"]$/g, '').trim();
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'h').toLowerCase();
  const multipliers = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 };
  return value * (multipliers[unit] || 3600);
}

const DEFAULT_RENEW_WHEN_REMAINING_SECONDS = 60 * 60; // 1h


function maybeIssueSlidingToken(decoded, res) {
  const expiresInEnv = (process.env.EXPIRES_IN || '24h').toString().replace(/^['"]|['"]$/g, '').trim();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = (decoded.exp || 0) - nowSeconds;

  const renewWhenRemaining = process.env.TOKEN_RENEW_WHEN_REMAINING;
  const renewThresholdSeconds =
    renewWhenRemaining != null && String(renewWhenRemaining).trim() !== ''
      ? parseDurationToSeconds(renewWhenRemaining) ?? DEFAULT_RENEW_WHEN_REMAINING_SECONDS
      : DEFAULT_RENEW_WHEN_REMAINING_SECONDS;

  logger.info(`[Auth] userId=${decoded.id} token expires in ${remainingSeconds}s (renew if < ${renewThresholdSeconds}s)`);

  const shouldRenew = remainingSeconds > 0 && remainingSeconds < renewThresholdSeconds;
  if (!shouldRenew) {
    res.setHeader('X-Token-Expires-In', expiresInEnv);
    return;
  }

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
  res.locals.accessToken = newToken;
  logger.debug(`[Auth] Sliding session: new token issued for userId=${decoded.id}, expiresIn=${expiresInEnv}`);
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

    maybeIssueSlidingToken(decoded, res);

    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.locals.accessToken && body && typeof body === 'object' && body.success && body.accessToken === undefined) {
        body = { ...body, accessToken: res.locals.accessToken };
      }
      return originalJson(body);
    };

    next();
  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired');
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Session expired. Please login again.',
        sessionExpired: true, 
        expiredAt: error.expiredAt,
        code: 'SESSION_EXPIRED', 
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
