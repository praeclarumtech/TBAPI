import express from 'express';
import { reports, statusByPercentage } from '../../controller/reportsController.js';

const router = express.Router();

router.get("/applicationOnProcessCount", reports);
router.get("/statusByPercentage", statusByPercentage);

export default router;
