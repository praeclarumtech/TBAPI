import express from 'express';
import { addDegree, getDegrees, updateDegreebyId, deleteDegree, getSingleDegree } from '../../controller/degreeController.js';
import { degreeValidation } from '../../validations/degreeValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import {Enum} from '../../utils/enum.js'

const router = express.Router();

router.post('/addDegree', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), validator.body(degreeValidation), addDegree);
router.get('/viewDegrees',authorization,verifyRoles([Enum.ADMIN, Enum.HR]), getDegrees);
router.get('/viewById/:degreeId', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), getSingleDegree);
router.put('/update/:degreeId', authorization, verifyRoles([Enum.ADMIN]), validator.body(degreeValidation), updateDegreebyId);
router.delete('/delete/deleteManyDegree', authorization, verifyRoles([Enum.ADMIN]), deleteDegree);

export default router;
