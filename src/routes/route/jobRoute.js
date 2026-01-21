import express from 'express';

import {
  createJob,
  viewJobs,
  viewJobDetails,
  updateJob,
  deleteJob,
  checkEmailForJobApplication,
  applyForJob,
  viewApplicantsForJob,
  viewInvitedApplicants,
  viewClientJobApplications,
  sendJobEmailToRecipients,
  getVendorsAndApplicantsForEmail,
  sendJobNotificationsToApplicants,
  sendApplicantStatusEmail,
  getJobApplicationsByRole,
} from '../../controller/jobController.js';
import { validator } from '../../helpers/validator.js';
import { createJobValidation } from '../../validations/jobValidation.js';
import { authorization } from '../../helpers/userMiddleware.js';
import {
  addJobApplication,
  scoreResume,
} from '../../controller/jobScoreController.js';
import { jobScoreResume } from '../../helpers/multer.js';
const router = express.Router();

router.post('/', authorization, validator.body(createJobValidation), createJob);
router.get('/viewJobs', authorization, viewJobs);
router.get('/public/viewJobs', viewJobs);

router.get('/client/applications', authorization, viewClientJobApplications);
router.get('/applications/by-role', authorization, getJobApplicationsByRole);
router.get('/email/recipients', authorization, getVendorsAndApplicantsForEmail);

router.post(
  '/applicant/send-status-email',
  authorization,
  sendApplicantStatusEmail
);

router.get('/:jobId/applicants', authorization, viewApplicantsForJob);
router.get('/:jobId/invited-applicants', authorization, viewInvitedApplicants);
router.post('/:jobId/send-email', authorization, sendJobEmailToRecipients);
router.post(
  '/:jobId/notify-matching-applicants',
  authorization,
  sendJobNotificationsToApplicants
);

router.get('/:id', viewJobDetails);
router.put('/:id', authorization, updateJob);
router.delete('/delete', authorization, deleteJob);

router.post('/jobScore', jobScoreResume, scoreResume);
router.post(
  '/addJobApplication',
  authorization,
  jobScoreResume,
  addJobApplication
);

router.post('/apply/:jobId/check-email', checkEmailForJobApplication);
router.post('/apply/:jobId', applyForJob);

export default router;
