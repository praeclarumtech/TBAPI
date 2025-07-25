import express from 'express';
import {
    applicationOnProcessCount,
    getApplicationsByDate,
    applicantSkillStatistics,
    applicantCountByCityAndState,
    applicantCountByAddedBy
} from '../../controller/reportsController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/applicationOnProcessCount', authorization, applicationOnProcessCount);
router.post('/applicantSkillStatistics', authorization, applicantSkillStatistics);
router.get('/applicantCountByCityAndState',authorization, applicantCountByCityAndState);
router.get('/applicantCountByAddedBy',authorization, applicantCountByAddedBy);

router.get('/getApplicationsByDate', authorization, getApplicationsByDate);

export default router;
