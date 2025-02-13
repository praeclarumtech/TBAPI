import express from 'express';
import { dashboard } from '../../controller/dashboardController.js';

const router = express.Router();

router.get("/totalApplicants", dashboard);

export default router;
