import express from 'express';
import { addDegree, getDegrees, updateDegreebyId, deleteDegree, getSingleDegree } from '../../controller/degreeController.js';
import { degreeValidation } from '../../validations/degreeValidation.js';
import { validator } from '../../helpers/validator.js';

const router = express.Router();

router.post('/addDegree', validator.body(degreeValidation), addDegree);
router.get('/viewDegrees', getDegrees);
router.get('/viewById/:degreeId', getSingleDegree);
router.put('/update/:degreeId', validator.body(degreeValidation), updateDegreebyId);
router.delete('/delete/:degreeId', deleteDegree);

export default router;
