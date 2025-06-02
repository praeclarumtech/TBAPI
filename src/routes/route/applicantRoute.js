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
  updateManyApplicant,
  viewImportedApplicantById,
  updateImportedApplicant,
  deleteImportedApplicant,
  deleteManyImportedApplicants,
  hardDeleteImportedApplicant,
  updateStatusImportApplicant,
  activeApplicant,
  inActiveApplicant,
  applicantFavoriteStatus
} from '../../controller/applicantController.js';
import {
  applicantValidation,
  updateApplicantValidation,
  updateManyApplicantsValidation,
} from '../../validations/applicantValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js'
const router = express.Router();

router.post('/addApplicant', authorization, validator.body(applicantValidation), addApplicant);

//same applicant route for Qr without auth 
router.post('/applicant-add-qr-code',addApplicant);
router.put('/applicant-edit-qr-code/:id',updateApplicant);

router.get('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', viewApplicant);
router.get('/viewResumeAndCsvApplicant', authorization, getResumeAndCsvApplicants);
router.put('/updateApplicant/:id', authorization, validator.body(updateApplicantValidation), updateApplicant);

router.put('/updateManyApplicant', authorization, validator.body(updateManyApplicantsValidation), updateManyApplicant);
router.get('/viewImportedApplicantById/:id', authorization, viewImportedApplicantById);
router.put('/updateImportedApplicant/:id', authorization, validator.body(updateApplicantValidation), updateImportedApplicant);
router.delete('/deleteImportedApplicant/:id', authorization, deleteImportedApplicant);
router.delete('/deleteManyImportedApplicants', authorization, deleteManyImportedApplicants);
router.delete('/hardDeleteImportedApplicant/:id', authorization, hardDeleteImportedApplicant);

router.put('/update/importApplicantstatus/:id', authorization, validator.body(updateApplicantValidation), updateStatusImportApplicant);

router.put('/update/status/:id', authorization, updateStatus);
router.delete('/deleteApplicant/:id', authorization, deleteApplicant);

router.post('/upload-resume', authorization, validator.body(updateApplicantValidation), uploadResumeAndCreateApplicant);

// import export applicant
router.post('/exportCsv', authorization, exportApplicantCsv);
router.post('/importCsv', authorization, importApplicantCsv);
router.delete('/deleteManyApplicants', authorization, deleteManyApplicants);

router.get('/checkApplicant', checkApplicantExists);

// Active - InActive
router.patch('/activateApplicant/:id', authorization, activeApplicant);
router.patch('/inactivateApplicant/:id', authorization, inActiveApplicant);

//favorite
router.patch('/favorite/status/:id', applicantFavoriteStatus);
export default router;
