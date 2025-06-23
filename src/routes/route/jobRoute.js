import express from 'express';

import { createJob, viewJobs, viewJobDetails, updateJob, deleteJob, viewJobsByVendorId } from '../../controller/jobController.js'
import { validator } from '../../helpers/validator.js';
import { createJobValidation, jobApplicationStatusValidation } from '../../validations/jobValidation.js';
import { authorization } from '../../helpers/userMiddleware.js'
import { addJobApplication, scoreResume, updateApplicantionStatus } from '../../controller/jobScoreController.js';
const router = express.Router();


router.post('/', authorization, validator.body(createJobValidation), createJob);
router.get('/viewJobs', authorization, viewJobs)
router.get('/public/viewJobs', viewJobs)
router.get('/viewJobs/vendor/:id', authorization, viewJobsByVendorId)
router.get('/:id', viewJobDetails)
router.put('/:id', authorization, updateJob)
router.delete('/delete', authorization, deleteJob)

router.post('/jobScore', scoreResume);
router.post('/addJobApplication', authorization, addJobApplication)
router.put('/update/applicantionStatus/:applicationId', authorization, validator.body(jobApplicationStatusValidation), updateApplicantionStatus)

export default router;
