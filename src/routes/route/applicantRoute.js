import express from 'express';
import {
  addApplicant,
  viewAllApplicant,
  viewApplicant,
  updateApplicant,
  deleteApplicant,
  updateStatus,
  uploadResumeAndCreateApplicant,
  deleteManyApplicants,
  getResumeAndCsvApplicants
} from '../../controller/applicantController.js';
import { applicantValidation, updateApplicantValidation } from '../../validations/applicantValidation.js';
import { validator } from '../../helpers/validator.js';
// import { authorization } from '../../helpers/userMiddleware.js';
 
const router = express.Router();
 
router.post('/addApplicant',validator.body(applicantValidation),addApplicant);
router.get('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', viewApplicant);
router.get('/viewResumeAndCsvApplicant', getResumeAndCsvApplicants);
router.put('/updateApplicant/:id',validator.body(updateApplicantValidation), updateApplicant);
 
router.put('/update/status/:id', updateStatus);
router.delete('/deleteApplicant/:id', deleteApplicant);

router.post('/upload-resume',
  validator.body(updateApplicantValidation),
  uploadResumeAndCreateApplicant);
router.delete('/deleteManyApplicants', deleteManyApplicants);
 
export default router;
 
 