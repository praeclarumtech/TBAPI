import express from "express";
import connectDB from "./src/db/db.connection.js";
import router from "./src/routes/routes.js";
import dotenv from "dotenv";
import helmet from "helmet";
import bodyParser from "body-parser";
dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

connectDB();
app.use(helmet());
app.use(express.json());
app.use("/api", router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.info(`Listening to Port :  ${port}`);
});

export default app;
