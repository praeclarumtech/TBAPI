import express from 'express';
import { viewAllDuplicateRecord, deleteManyDuplicatrecords } from '../../controller/duplicateRecordController.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

// router.post('/addDegree', authorization, validator.body(degreeValidation), addDegree);
router.get('/viewAllDuplicateRecord', authorization, viewAllDuplicateRecord);
// router.get('/viewById/:degreeId', authorization, getSingleDegree);
// router.put('/update/:degreeId', authorization, validator.body(degreeValidation), updateDegreebyId);
router.delete('/deleteManyDuplicatrecords', authorization, deleteManyDuplicatrecords);

export default router;
