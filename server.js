import express from 'express';
import connectDB from './src/helpers/db.connection.js';
import router from './src/routes/routes.js';
import dotenv from 'dotenv';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { errorHandlerMiddleware } from './src/helpers/errorHandle.js';
import { Message } from './src/utils/message.js';
import logger from './src/loggers/logger.js';
dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

connectDB();
app.use(helmet());
app.use(express.json());
app.use(errorHandlerMiddleware);
// app.use((err, req, res, next) => {
//   if (err && err.error && err.error.isJoi) {
//       return res.status(400).json({
//           success: false,
//           message: "Validation error",
//           details: err.error.details.map(detail => detail.message),
//       });
//   }
//   console.error(err);
//   res.status(500).json({ success: false, message: "Internal Server Error" });
// });
app.use('/api', router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`${Message.LISTENING_TO_PORT} :  ${port}`);

});

export default app;
