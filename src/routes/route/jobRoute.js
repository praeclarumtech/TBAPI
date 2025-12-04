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
  viewClientJobApplications,
  sendJobEmailToRecipients,
  getVendorsAndApplicantsForEmail,
  sendJobNotificationsToApplicants,
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
router.get('/email/recipients', authorization, getVendorsAndApplicantsForEmail);

router.get('/:jobId/applicants', authorization, viewApplicantsForJob);
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
