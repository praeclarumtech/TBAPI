import express from 'express';
import { reports } from '../../controller/reportsController.js';

const router = express.Router();

router.get("/applicationOnProcessCount", reports);

export default router;
