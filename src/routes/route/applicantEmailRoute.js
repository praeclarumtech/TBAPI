import express from 'express';
import { sendEmail,getAllEmails,deleteOneEmail,deleteManyEmails} from '../../controller/applicantEmailController.js';
import {sendEmailValidation} from '../../validations/sendEMailValidation.js'
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/user.middleware.js';
const router = express.Router();

router.post('/sendEmail',authorization,validator.body(sendEmailValidation),sendEmail);
router.get('/getAllEmails',getAllEmails);
router.delete('/deleteOneEmail/:id',deleteOneEmail);
router.delete('/deleteManyEmails',deleteManyEmails);
export default router;
