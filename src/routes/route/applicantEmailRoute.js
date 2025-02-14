import express from 'express';
import { sendEmail } from '../../controller/applicantEmailController.js';

const router = express.Router();

router.post('/sendEmail',sendEmail);
export default router;
