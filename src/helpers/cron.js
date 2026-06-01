import cron from 'node-cron';
import logger from '../loggers/logger.js';
import { backupMongoToDrive } from './mongoBackupToDrive.js';

const defaultMongoBackupSchedule = '30 23 * * *';
const defaultTimezone = 'Asia/Kolkata';

export const runMongoBackupCronTask = async () => {
  try {
    await backupMongoToDrive();
  } catch (error) {
    logger.error(`Mongo backup cron failed: ${error.message || error}`);
  }
};

export const startMongoBackupScheduler = () => {
  if (process.env.MONGO_BACKUP_ENABLED === 'false') {
    logger.info('Mongo backup scheduler is disabled');
    return null;
  }

  const schedule = process.env.MONGO_BACKUP_CRON || defaultMongoBackupSchedule;
  const timezone = process.env.MONGO_BACKUP_TIMEZONE || defaultTimezone;

  if (!cron.validate(schedule)) {
    logger.error(`Mongo backup scheduler has invalid cron expression: ${schedule}`);
    return null;
  }

  const task = cron.schedule(
    schedule,
    async () => {
      logger.info('Mongo backup cron started');
      await runMongoBackupCronTask();
    },
    { timezone }
  );

  logger.info(`Mongo backup scheduler started: ${schedule} (${timezone})`);
  return task;
};

export const runSampleCronTask = async () => {
  try {
    logger.info('Performing the sample cron task...');
  } catch (error) {
    logger.error(error);
  }
};
