import express from 'express';
import { sendEmail, getAllEmails, deleteManyEmails, viewEmailById ,generateMultipleQrs} from '../../controller/applicantEmailController.js';
import { sendEmailValidation } from '../../validations/sendEMailValidation.js'
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';
import { uploadAttachments } from '../../helpers/multer.js';
const router = express.Router();

router.post('/sendEmail', authorization, uploadAttachments, validator.body(sendEmailValidation),sendEmail);
router.post('/editEmail', authorization, validator.body(sendEmailValidation), sendEmail);
router.get('/getAllEmails', authorization, getAllEmails);
router.get('/viewEmailById/:id', authorization, viewEmailById);
router.delete('/deleteManyEmails', authorization, deleteManyEmails);
router.post('/generateMultipleQrs',generateMultipleQrs)
export default router;
