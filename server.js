import express from 'express';
import connectDB from './src/helpers/dbConnection.js';
import router from './src/routes/routes.js';
import driveAuthRouter from './src/routes/route/driveAuthRoute.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import { errorHandlerMiddleware } from './src/helpers/errorHandle.js';
import { Message } from './src/utils/constant/message.js';
import logger from './src/loggers/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMongoBackupScheduler } from './src/helpers/cron.js';

dotenv.config();

// Resolve paths relative to this file so uploads work regardless of process cwd (e.g. in production)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'src', 'uploads');

const app = express();
connectDB();
startMongoBackupScheduler();

// Trust proxy so req.protocol and req.get('host') are correct behind nginx/load balancer (production)
app.set('trust proxy', 1);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());
app.use(helmet());
app.use('/uploads/profile', express.static(path.join(uploadsDir, 'profile')));
app.use('/uploads/Attachments', express.static(path.join(uploadsDir, 'Attachments')));

app.use(express.json());
app.use('/tb', driveAuthRouter);
app.use('/api', router);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`${Message.LISTENING_TO_PORT} :  ${port}`);
});

export default app;
