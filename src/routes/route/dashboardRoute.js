import express from 'express';
import { dashboard, dashboardProcess} from '../../controller/dashboardController.js';
import {viewAllApplicant} from '../../controller/applicantController.js';

const router = express.Router();

router.get('/Applicant/count', dashboard);
router.get('/recentApplicant', viewAllApplicant);
router.get('/Applicant/Percentage', dashboardProcess);

export default router;
