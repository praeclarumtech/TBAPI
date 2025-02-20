import express from 'express';
import { dashboard, applicantDetails} from '../../controller/dashboardController.js';
import {viewAllApplicant} from '../../controller/applicantController.js';

const router = express.Router();

router.get('/count', dashboard);
router.get('/recentApplicant', viewAllApplicant);
router.post('/applicantDetails', applicantDetails); 

export default router;
