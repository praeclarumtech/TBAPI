import express from 'express';
import { deleteApplicant, fetchAppliedJobs, getVendorJobApplicantReport, importVendors, updateApplicantStatus, viewApplicantionsById, viewJobApplicantionsByVendor } from '../../controller/jobScoreController.js'
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js'
import { jobApplicationStatusValidation } from '../../validations/jobValidation.js';
import { validator } from '../../helpers/validator.js';
import { validateUserRegistration } from '../../validations/authValidation.js';
const router = express.Router();

router.get('/myApplications', authorization, fetchAppliedJobs)
router.get('/viewApplications', authorization, viewJobApplicantionsByVendor)
router.get('/viewApplicantionsById/:applicationId', authorization, viewApplicantionsById)
router.delete('/deleteApplicant', authorization, deleteApplicant)
router.put('/updateApplicantStatus/:id', authorization, validator.body(jobApplicationStatusValidation), updateApplicantStatus)
router.get('/job-applicant-report', authorization, verifyRoles(['admin', 'hr']), getVendorJobApplicantReport);
router.post('/import', authorization, importVendors)
export default router;