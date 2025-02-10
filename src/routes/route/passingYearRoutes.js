const express = require("express");
const { addYear, getYearById, getYears, updateYear, deleteYear } = require('../../controller/passingYear.controller');
const { validateId, passingYearValidation } = require('../../validations/yearsValidation');
const validator = require('../../helpers/validator'); 

const router = express.Router();

router.post('/', validator.body(passingYearValidation), addYear);
router.get('/listOfYears', getYears);
router.get('/getYearById/:id', validator.params(validateId), getYearById);
router.put('/updateYear/:id', validator.params(validateId), validator.body(passingYearValidation), updateYear);
router.delete('/deleteYear/:id', validator.params(validateId), deleteYear);

module.exports = router;
