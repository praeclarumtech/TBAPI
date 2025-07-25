import express from 'express';
import { addDegree, getDegrees, updateDegreebyId, deleteDegree, getSingleDegree } from '../../controller/degreeController.js';
import { degreeValidation } from '../../validations/degreeValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addDegree', authorization, verifyRoles(['admin', 'hr']), validator.body(degreeValidation), addDegree);
router.get('/viewDegrees',authorization,verifyRoles(['admin', 'hr']), getDegrees);
router.get('/viewById/:degreeId', authorization, verifyRoles(['admin','hr']), getSingleDegree);
router.put('/update/:degreeId', authorization, verifyRoles(['admin']), validator.body(degreeValidation), updateDegreebyId);
router.delete('/delete/deleteManyDegree', authorization, verifyRoles(['admin']), deleteDegree);

export default router;
