const express = require("express");
const connectDb = require('./src/helpers/db.connection')
const yearRoute = require('./src/routes/routes')
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
connectDb()
const helmet = require("helmet");
app.use(helmet());

require('dotenv').config()
app.use(express.json())
app.use('/api',yearRoute)

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.info(`Listening to Port :  ${port}`);
});
module.exports = app;
