import cron from 'node-cron';
import logger from '../loggers/logger.js';

export const runSampleCronTask = async (req, res) => {
  try { 
    logger.info('🛠️ Performing the actual cron task...');
  } catch (error) {
    logger.error(error);
  }
};

// Auto cron scheduler
cron.schedule('*/3 * * * *', async () => {
  await runSampleCronTask();
});


