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
  getResumeAndCsvApplicants,
  exportApplicantCsv,
  importApplicantCsv,
  checkApplicantExists,
  updateManyApplicant
} from '../../controller/applicantController.js';
import {
  applicantValidation,
  updateApplicantValidation,
  updateManyApplicantsValidation,
} from '../../validations/applicantValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js'
const router = express.Router();
 
router.post('/addApplicant',validator.body(applicantValidation),addApplicant);
router.get('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', viewApplicant);
router.get('/viewResumeAndCsvApplicant', getResumeAndCsvApplicants);
router.put('/updateApplicant/:id',validator.body(updateApplicantValidation), updateApplicant);
router.put('/updateManyApplicant',validator.body(updateManyApplicantsValidation),updateManyApplicant);
 
router.put('/update/status/:id', updateStatus);
router.delete('/deleteApplicant/:id', deleteApplicant);

router.post('/upload-resume',validator.body(updateApplicantValidation),uploadResumeAndCreateApplicant);

// import export applicant
router.get('/exportCsv', exportApplicantCsv);
router.post('/importCsv', authorization, importApplicantCsv);
router.delete('/deleteManyApplicants', deleteManyApplicants);

router.get('/checkApplicant', checkApplicantExists);

export default router;
