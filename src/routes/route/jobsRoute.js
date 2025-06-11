import express from 'express';

import { createJob, viewJobs, viewJobDetails, updateJob, deleteJob } from '../../controller/jobController.js'
import { validator } from '../../helpers/validator.js';
import { createJobValidation } from '../../validations/jobValidation.js';
const router = express.Router();


router.post('/create', validator.body(createJobValidation), createJob);
router.get('/getJobs', viewJobs)
router.get('/getJob/:id', viewJobDetails)
router.put('/update/:id', updateJob)
router.delete('/delete', deleteJob)
export default router;
