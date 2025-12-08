import express from 'express';
import {
  deleteApplicant,
  fetchAppliedJobs,
  getVendorJobApplicantReport,
  updateApplicantStatus,
  viewApplicantionsById,
  viewJobApplicantionsByVendor,
  addVendor,
  addVendorByQrCode,
  updateVendorByQrCode,
} from '../../controller/jobScoreController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import { jobApplicationStatusValidation } from '../../validations/jobValidation.js';
import { validator } from '../../helpers/validator.js';
import { Enum } from '../../utils/enum.js';
import {
  addVendorValidation,
  vendorValidation,
  addVendorQrCodeValidation,
} from '../../validations/userValidation.js';
import { uploadAttachments, parseFormData } from '../../helpers/multer.js';
const router = express.Router();

router.post('/addVendor', validator.body(addVendorValidation), addVendor);
// QR Code routes (no authentication required) - using parseFormData to handle form-data
router.post(
  '/vendor-add-qr-code',
  parseFormData,
  validator.body(addVendorQrCodeValidation),
  addVendorByQrCode
);
router.put(
  '/vendor-edit-qr-code/:vendorId',
  parseFormData,
  validator.body(vendorValidation),
  updateVendorByQrCode
);
router.get('/myApplications', authorization, fetchAppliedJobs);
router.get('/viewApplications', authorization, viewJobApplicantionsByVendor);
router.get(
  '/viewApplicantionsById/:applicationId',
  authorization,
  viewApplicantionsById
);
router.delete('/deleteApplicant', authorization, deleteApplicant);
router.put(
  '/updateApplicantStatus/:id',
  authorization,
  validator.body(jobApplicationStatusValidation),
  updateApplicantStatus
);
router.get(
  '/job-applicant-report',
  authorization,
  verifyRoles([Enum.ADMIN, Enum.HR]),
  getVendorJobApplicantReport
);

export default router;
