import { createLogger, format, transports } from 'winston';
import 'winston-mongodb';
import 'winston-daily-rotate-file';
import dotenv from 'dotenv';
dotenv.config();

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const jsonFormat = format.combine(
  format.timestamp(),
  format.json(),
  format.errors({ stack: true })
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Console transport with colorized output
    new transports.Console({
      format: consoleFormat,
    }),

    // Daily rotating file for error logs
    new transports.DailyRotateFile({
      filename: 'logs/error/%DATE%_error.log',
      datePattern: 'DDMMYYYY',
      zippedArchive: true,
      level: 'error',
      format: jsonFormat,
      maxFiles: '7d',
    }),

    // Daily rotating file for combined logs (all levels)
    new transports.DailyRotateFile({
      filename: 'logs/combined/%DATE%_combined.log',
      datePattern: 'DDMMYYYY',
      zippedArchive: true,
      format: jsonFormat,
      maxFiles: '7d',
    }),

    // MongoDB transport for error logs
    new transports.MongoDB({
      level: 'error',
      db: process.env.DBURL,
      collection: 'logs',
    }),
  ],
  exceptionHandlers: [
    // Daily rotating file for uncaught exceptions
    new transports.DailyRotateFile({
      filename: 'logs/exceptions/%DATE%_exceptions.log',
      datePattern: 'DDMMYYYY',
      zippedArchive: true,
      format: jsonFormat,
      maxFiles: '7d',
    }),
  ],
});

export default logger;
