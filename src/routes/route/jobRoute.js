import express from 'express';

import { createJob, viewJobs, viewJobDetails, updateJob, deleteJob } from '../../controller/jobController.js'
import { validator } from '../../helpers/validator.js';
import { createJobValidation } from '../../validations/jobValidation.js';
import { authorization } from '../../helpers/userMiddleware.js'
import { addJobApplication, scoreResume } from '../../controller/jobScoreController.js';
import { uploadResume } from '../../helpers/multer.js';
const router = express.Router();


router.post('/', authorization, validator.body(createJobValidation), createJob);
router.get('/viewJobs', authorization, viewJobs)
router.get('/:id', viewJobDetails)
router.put('/:id', authorization, updateJob)
router.delete('/delete', authorization, deleteJob)

router.post('/jobScore', scoreResume);
router.post('/addJobApplication',addJobApplication)

export default router;
