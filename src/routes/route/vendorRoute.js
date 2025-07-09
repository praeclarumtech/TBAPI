import express from 'express';
import { fetchAppliedJobs } from '../../controller/jobScoreController.js'
import { authorization } from '../../helpers/userMiddleware.js'
const router = express.Router();
router.get('/myApplications', authorization, fetchAppliedJobs)

export default router;