import express from 'express';
import connectDB from './src/helpers/db.connection.js';
import router from './src/routes/routes.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from "cors";
import { upload } from './src/helpers/multer.js';
import bodyParser from 'body-parser';
import { errorHandlerMiddleware } from './src/helpers/errorHandle.js';
import { Message } from './src/utils/message.js';
import logger from './src/loggers/logger.js';
dotenv.config();

const app = express();
connectDB();

// const upload = multer();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// app.use(upload.none());

app.use(helmet());
app.use('uploads/profile', express.static('uploads'));

app.use(express.json());
app.use('/api', router);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running fine on ${port}`);

  logger.info(`${Message.LISTENING_TO_PORT} :  ${port}`);
});

export default app;
