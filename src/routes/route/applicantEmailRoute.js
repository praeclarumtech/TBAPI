import express from 'express';
import { sendEmail, getAllEmails, deleteManyEmails, viewEmailById, generateMultipleQrs, getEmailCount } from '../../controller/applicantEmailController.js';
import { sendEmailValidation } from '../../validations/sendEMailValidation.js'
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import { uploadAttachments } from '../../helpers/multer.js';
import {Enum} from '../../utils/enum.js'
const router = express.Router();

router.post('/sendEmail', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), uploadAttachments, validator.body(sendEmailValidation), sendEmail);
router.post('/editEmail', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), validator.body(sendEmailValidation), sendEmail);
router.get('/getAllEmails', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), getAllEmails);
router.get('/viewEmailById/:id', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), viewEmailById);
router.delete('/deleteManyEmails', authorization, verifyRoles([Enum.ADMIN]), deleteManyEmails);
router.post('/generateMultipleQrs', generateMultipleQrs);
router.get('/count', authorization, verifyRoles([Enum.ADMIN]), getEmailCount);
export default router;
