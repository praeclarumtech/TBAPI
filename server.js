const express = require("express");
const connectDb =require('./src/helpers/db.connection');
const router = require('./src/routes/route.js');
const app = express();
connectDb();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const helmet = require("helmet");
app.use(helmet());

require('dotenv').config()

app.use("/api",router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.info(`Listening to Port :  ${port}`);
});
module.exports = app;
