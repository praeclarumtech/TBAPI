import express from 'express';
import {
    applicationOnProcessCount,
    statusByPercentage,
    getApplicationsByDate,
    categoryWiseSkillCount
} from '../../controller/reportsController.js';

const router = express.Router();

router.get('/applicationOnProcessCount', applicationOnProcessCount);
router.get('/statusByPercentage', statusByPercentage);
router.get('/categoryWiseSkillCount', categoryWiseSkillCount);

router.get("/getApplicationsByDate", getApplicationsByDate);

export default router;
