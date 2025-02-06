const express = require("express")
const {addYear,getYearById,getYears,updateYear,deleteYear} = require('../../controller/passingYear.controller')
const {validateId,passingYearValidation} = require('../../validations/yearsValidation')
const router = express.Router()


router.post('/',passingYearValidation,addYear)
router.get('/listOfYears',getYears)
router.get('/getYearById/:id',validateId,passingYearValidation,getYearById)
router.put('/updateYear/:id',validateId,passingYearValidation,updateYear)
router.delete('/deleteYear/:id',validateId,deleteYear)

module.exports = router