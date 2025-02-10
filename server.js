import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDb from './src/helpers/db.connection.js';
import yearRoute from './src/routes/routes.js';
import { Message } from './src/utils/constant/passingYearMessage.js';
import { errorHandler } from './src/helpers/errorHandler.js';


dotenv.config();

const app = express();


app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet());
app.use(express.json());


connectDb();


app.use('/api', yearRoute);
app.use(errorHandler);


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.info(`${Message.LIS_PORT} : ${port}`);
});

// Exporting as ES6 module
export default app;
