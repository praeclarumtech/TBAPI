import express from 'express';
import {
  createEmailTemplateController,
  viewEmailTemplateController,
  updateEmailTemplateController,
  deleteEmailTemplateController,
  getAllEmailTemplatesController,
  getEmailTemplateByStatusController
} from '../../controller/applicantEmailTempletController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js'

const router = express.Router();
 
router.post('/createEmailTemplate', authorization,verifyRoles(['admin','hr']), createEmailTemplateController);
router.get('/viewEmailTemplate/:id', authorization,verifyRoles(['admin','hr']), viewEmailTemplateController);
router.put('/updateEmailTemplate/:id', authorization, verifyRoles(['admin']),updateEmailTemplateController);
router.delete('/deleteEmailTemplate/:id', authorization,verifyRoles(['admin']), deleteEmailTemplateController);
router.get('/getAllEmailTemplates', authorization,verifyRoles(['admin','hr']), getAllEmailTemplatesController);
router.get('/templateByType/:type', authorization,verifyRoles(['admin']), getEmailTemplateByStatusController);
 
export default router;