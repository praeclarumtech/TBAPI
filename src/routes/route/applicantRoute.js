import express from 'express';
import {
  addApplicant,
  viewAllApplicant,
  viewApplicant,
  updateApplicant,
  deleteApplicant,
  updateStatus,
} from '../../controller/applicantController.js';
import { applicantValidation, updateApplicantValidation } from '../../validations/applicantValidation.js';
import { validator } from '../../helpers/validator.js';
// import { authorization } from '../../helpers/userMiddleware.js';
 
const router = express.Router();
 
router.post('/addApplicant', validator.body(applicantValidation), addApplicant);
router.post('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', viewApplicant);
router.put('/updateApplicant/:id',validator.body(updateApplicantValidation), updateApplicant);
 
router.put('/update/status/:id', updateStatus);
router.delete('/deleteApplicant/:id', deleteApplicant);
 
export default router;
 
 