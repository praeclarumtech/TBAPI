import express from 'express';
import {
    sendEmail,
    getAllEmails,
    deleteManyEmails,
} from '../../controller/applicantEmailController.js';
import { authorization } from '../../helpers/userMiddleware.js';
import { uploadAttachments } from '../../helpers/multer.js';
const router = express.Router();

router.post('/sendEmail', authorization, uploadAttachments, sendEmail);
router.get('/getAllEmails', getAllEmails);
router.delete('/deleteManyEmails', deleteManyEmails);
export default router;
