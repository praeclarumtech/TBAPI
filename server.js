const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const helmet = require("helmet");
app.use(helmet());

require('dotenv').config()


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.info(`Listening to Port :  ${port}`);
});
module.exports = app;
