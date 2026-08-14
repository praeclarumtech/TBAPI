import mongoose from 'mongoose';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import loadEnv from './loadEnv.js';
loadEnv();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DBURL, {
      useNewUrlParser: true,
    });
    logger.info(Message.MONGODB_CONNECTED);
  } catch (error) {
    logger.error(`${Message.MONGODB_CONNECTION_ERROR}`);
    process.exit(1);
  }
};

export default connectDB;
