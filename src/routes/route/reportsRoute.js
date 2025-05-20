import express from 'express';
import {
    applicationOnProcessCount,
    statusByPercentage,
    getApplicationsByDate,
    applicantSkillStatistics,
    applicantCountByCityAndState,
    applicantCountByAddedBy,
    applicantCountByExperienceRange,
    expectedPackageChart,
    noticePeriodHistogram
} from '../../controller/reportsController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/applicationOnProcessCount', authorization, applicationOnProcessCount);
router.get('/statusByPercentage', authorization, statusByPercentage);
router.post('/applicantSkillStatistics', authorization, applicantSkillStatistics);
router.get('/applicantCountByCityAndState',authorization, applicantCountByCityAndState);
router.get('/applicantCountByAddedBy',authorization, applicantCountByAddedBy);
router.get('/experienceRange',authorization, applicantCountByExperienceRange);

router.get('/getApplicationsByDate', authorization, getApplicationsByDate);
router.get('/expectedPackageChart', authorization, expectedPackageChart);
router.get('/noticePeriodHistogram', authorization, noticePeriodHistogram);

export default router;
