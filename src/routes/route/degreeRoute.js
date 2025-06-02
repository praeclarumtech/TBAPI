import express from 'express';
import { addDegree, getDegrees, updateDegreebyId, deleteDegree, getSingleDegree } from '../../controller/degreeController.js';
import { degreeValidation } from '../../validations/degreeValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addDegree', authorization, validator.body(degreeValidation), addDegree);
router.get('/viewDegrees', getDegrees);
router.get('/viewById/:degreeId', authorization, getSingleDegree);
router.put('/update/:degreeId', authorization, validator.body(degreeValidation), updateDegreebyId);
router.delete('/delete/deleteManyDegree', authorization, deleteDegree);

export default router;
