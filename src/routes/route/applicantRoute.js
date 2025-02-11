import express from 'express';
import { addApplicant, viewAllApplicant, viewApplicant, updateApplicant, deleteApplicant } from '../../controller/applicantController.js';

// const router = express.Router();
const router = express.Router();

router.post('/addApplicant', addApplicant);
router.get('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', viewApplicant);
router.put("/updateApplicant/:id", updateApplicant);
router.delete("/deleteApplicant/:id", deleteApplicant);

export default router;