import express from 'express';
import {
    applicationOnProcessCount,
    statusByPercentage,
    getApplicationsByDate,
    applicantSkillStatistics,
    applicantCountByCityAndState,
} from '../../controller/reportsController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/applicationOnProcessCount', authorization, applicationOnProcessCount);
router.get('/statusByPercentage', authorization, statusByPercentage);
router.post('/applicantSkillStatistics', authorization, applicantSkillStatistics);
router.get('/applicantCountByCityAndState', applicantCountByCityAndState);

router.get("/getApplicationsByDate", authorization, getApplicationsByDate);

export default router;
