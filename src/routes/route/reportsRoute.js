import express from 'express';
import {
    applicationOnProcessCount,
    statusByPercentage,
    getApplicationsByDate,
    technologyStatistics
} from '../../controller/reportsController.js';

const router = express.Router();

router.get('/applicationOnProcessCount', applicationOnProcessCount);
router.get('/statusByPercentage', statusByPercentage);
router.get('/technologyStatistics', technologyStatistics);

router.get("/getApplicationsByDate", getApplicationsByDate);

export default router;
