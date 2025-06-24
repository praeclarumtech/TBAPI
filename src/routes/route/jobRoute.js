import express from 'express';

import { createJob, viewJobs, viewJobDetails, updateJob, deleteJob, viewJobsByVendorId } from '../../controller/jobController.js'
import { validator } from '../../helpers/validator.js';
import { createJobValidation, jobApplicationStatusValidation, jobApplicationIdParamValidation } from '../../validations/jobValidation.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js'
import { addJobApplication, scoreResume, updateApplicantionStatus } from '../../controller/jobScoreController.js';
import { jobScoreResume } from '../../helpers/multer.js';
const router = express.Router();


router.post('/', authorization, verifyRoles(['vendor']), validator.body(createJobValidation), createJob);
router.get('/viewJobs', authorization, verifyRoles(['vendor', 'admin']), viewJobs)
router.get('/public/viewJobs', viewJobs)
router.get('/viewJobs/vendor/:id', authorization, verifyRoles(['vendor']), viewJobsByVendorId)
router.get('/:id', viewJobDetails)
router.put('/:id', authorization, verifyRoles(['vendor']), updateJob)
router.delete('/delete', authorization, verifyRoles(['vendor']), deleteJob)

router.post('/jobScore', jobScoreResume, verifyRoles(['guest']), scoreResume);
router.post('/addJobApplication', authorization, verifyRoles(['guest']), jobScoreResume, addJobApplication)
router.put('/update/applicantionStatus/:applicationId', authorization, verifyRoles(['vendor']), validator.params(jobApplicationIdParamValidation), validator.body(jobApplicationStatusValidation), updateApplicantionStatus)

export default router;
