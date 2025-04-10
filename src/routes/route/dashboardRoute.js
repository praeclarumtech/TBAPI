import express from 'express';
import { dashboard, applicantDetails} from '../../controller/dashboardController.js';
import {viewAllApplicant} from '../../controller/applicantController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/count', authorization, dashboard);
router.get('/recentApplicant', authorization, viewAllApplicant);
router.get('/applicantDetails', authorization, applicantDetails); 

export default router;
