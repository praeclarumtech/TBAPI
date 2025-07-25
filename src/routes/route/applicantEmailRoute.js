import express from 'express';
import { sendEmail, getAllEmails, deleteManyEmails, viewEmailById, generateMultipleQrs, getEmailCount } from '../../controller/applicantEmailController.js';
import { sendEmailValidation } from '../../validations/sendEMailValidation.js'
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import { uploadAttachments } from '../../helpers/multer.js';
const router = express.Router();

router.post('/sendEmail', authorization, verifyRoles(['admin', 'hr']), uploadAttachments, validator.body(sendEmailValidation), sendEmail);
router.post('/editEmail', authorization, verifyRoles(['admin', 'hr']), validator.body(sendEmailValidation), sendEmail);
router.get('/getAllEmails', authorization, verifyRoles(['admin', 'hr']), getAllEmails);
router.get('/viewEmailById/:id', authorization, verifyRoles(['admin', 'hr']), viewEmailById);
router.delete('/deleteManyEmails', authorization, verifyRoles(['admin']), deleteManyEmails);
router.post('/generateMultipleQrs', generateMultipleQrs)
router.get('/count', authorization, verifyRoles(['admin']), getEmailCount);
export default router;
