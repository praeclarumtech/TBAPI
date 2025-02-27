import express from 'express';
import {
  sendEmail,
  getAllEmails,
  deleteManyEmails,
} from '../../controller/applicantEmailController.js';
import { uploadAttachments } from '../../helpers/multer.js';
const router = express.Router();

router.post('/sendEmail', uploadAttachments, sendEmail);
router.post('/updateEmail', uploadAttachments, sendEmail);
router.get('/getAllEmails', getAllEmails);
router.delete('/deleteManyEmails', deleteManyEmails);
export default router;
