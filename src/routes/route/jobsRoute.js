import express from 'express';

import { createJob, viewJobs, viewJobDetails, updateJob, deleteJob, addApplicantByJob } from '../../controller/jobController.js'
import { validator } from '../../helpers/validator.js';
import { createJobValidation } from '../../validations/jobValidation.js';
import { authorization } from '../../helpers/userMiddleware.js'
const router = express.Router();


router.post('/create', authorization, validator.body(createJobValidation), createJob);

// add applicantform
router.post('/createByJob', addApplicantByJob);

router.get('/getJobs', authorization, viewJobs)
router.get('/getJob/:id', viewJobDetails)
router.put('/update/:id', authorization, updateJob)
router.delete('/delete', authorization, deleteJob)
export default router;
