import mongoose from 'mongoose';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DBURL, {
      useNewUrlParser: true });
    logger.info(Message.MONGODB_CONNECTED);
  } catch (error) {
    logger.error(`${Message.MONGODB_CONNECTION_ERROR}: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
