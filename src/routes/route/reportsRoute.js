import express from 'express';
import { applicationOnProcessCount, statusByPercentage, technologyStatistics } from '../../controller/reportsController.js';

const router = express.Router();

router.get("/applicationOnProcessCount", applicationOnProcessCount);
router.get("/statusByPercentage", statusByPercentage);
router.get("/technologyStatistics", technologyStatistics);

export default router;
