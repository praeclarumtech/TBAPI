const express = require('express')
const yearRoute = require('./route/passingYearRoutes')
const router = express.Router()

router.use("/year",yearRoute)

module.exports = router
