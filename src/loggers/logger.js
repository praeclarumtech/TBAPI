import { createLogger, format, transports } from 'winston';
import 'winston-mongodb';
import dotenv from 'dotenv';

dotenv.config(); 

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const logger = createLogger({
  level: 'info', 
  format: logFormat,
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),

    new transports.File({ filename: 'logs/app.log' }),

    new transports.File({ filename: 'logs/error.log', level: 'error' }),

    new transports.MongoDB({
      level: 'error',
      db: process.env.DBURL, 
      collection: 'logs',
      // options: { useUnifiedTopology: true },
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }), 
  ],
});

export default logger;
