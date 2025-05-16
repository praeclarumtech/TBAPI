import express from 'express';
import { dashboard, applicantDetails, getApplicantMonthWiseCount} from '../../controller/dashboardController.js';
import {viewAllApplicant} from '../../controller/applicantController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/count', authorization, dashboard);
router.get('/recentApplicant', authorization, viewAllApplicant);
router.get('/applicantDetails', authorization, applicantDetails);
router.get('/monthWiseCount', getApplicantMonthWiseCount); 

export default router;
