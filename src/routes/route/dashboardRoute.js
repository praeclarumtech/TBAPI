import express from 'express';
import { dashboard, dashboardProcess} from '../../controller/dashboardController.js';

const router = express.Router();

router.get("/totalApplicants", dashboard);
router.get("/ApplicantsPercentage", dashboardProcess);

export default router;
