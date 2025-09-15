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
  inActiveApplicant
} from '../../controller/applicantController.js';
import {
  applicantValidation,
  updateApplicantValidation,
  updateManyApplicantsValidation,
} from '../../validations/applicantValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js'
import { uploadAttachments } from '../../helpers/multer.js';
import { Enum } from '../../utils/enum.js';
const router = express.Router();

router.post('/addApplicant', authorization, validator.body(applicantValidation), verifyRoles(Enum.ADMIN), addApplicant);

//same applicant route for Qr without auth 
router.post('/applicant-add-qr-code', uploadAttachments, addApplicant);
router.put('/applicant-edit-qr-code/:id', uploadAttachments, updateApplicant);

router.get('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', authorization, verifyRoles(Enum.ADMIN), viewApplicant);
router.get('/viewResumeAndCsvApplicant', authorization, getResumeAndCsvApplicants);
router.put('/updateApplicant/:id', authorization, verifyRoles(Enum.ADMIN), validator.body(updateApplicantValidation), updateApplicant);

router.put('/updateManyApplicant', authorization, verifyRoles(Enum.ADMIN), validator.body(updateManyApplicantsValidation), updateManyApplicant);
router.get('/viewImportedApplicantById/:id', authorization, viewImportedApplicantById);
router.put('/updateImportedApplicant/:id', authorization, verifyRoles(Enum.ADMIN), validator.body(updateApplicantValidation), updateImportedApplicant);
router.delete('/deleteImportedApplicant/:id', authorization, verifyRoles(Enum.ADMIN), deleteImportedApplicant);
router.delete('/deleteManyImportedApplicants', authorization, verifyRoles(Enum.ADMIN), deleteManyImportedApplicants);
router.delete('/hardDeleteImportedApplicant/:id', authorization, verifyRoles(Enum.ADMIN), hardDeleteImportedApplicant);

router.put('/update/importApplicantstatus/:id', authorization, verifyRoles(Enum.ADMIN), validator.body(updateApplicantValidation), updateStatusImportApplicant);

router.put('/update/status/:id', authorization, verifyRoles(Enum.ADMIN), updateStatus);
router.delete('/deleteApplicant/:id', authorization, verifyRoles(Enum.ADMIN), deleteApplicant);

router.post('/upload-resume', authorization, validator.body(updateApplicantValidation), uploadResumeAndCreateApplicant);

// import export applicant
router.post('/exportCsv', authorization, verifyRoles(Enum.ADMIN), exportApplicantCsv);
router.post('/importCsv', authorization, verifyRoles(Enum.ADMIN), importApplicantCsv);
router.delete('/deleteManyApplicants', authorization, verifyRoles(Enum.ADMIN), deleteManyApplicants);

// validate to phone , whatsapp and email
router.get('/checkApplicant', checkApplicantExists);

// Active - InActive
router.patch('/activateApplicant/:id', authorization, verifyRoles(Enum.ADMIN), activeApplicant);
router.patch('/inactivateApplicant/:id', authorization, verifyRoles(Enum.ADMIN), inActiveApplicant);

export default router;
