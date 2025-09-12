import express from 'express';
import {
  createEmailTemplateController,
  viewEmailTemplateController,
  updateEmailTemplateController,
  deleteEmailTemplateController,
  getAllEmailTemplatesController,
  getEmailTemplateByStatusController
} from '../../controller/applicantEmailTempletController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import {Enum} from '../../utils/enum.js';

const router = express.Router();

router.post('/createEmailTemplate', authorization,verifyRoles([Enum.ADMIN, Enum.HR]), createEmailTemplateController);
router.get('/viewEmailTemplate/:id', authorization,verifyRoles([Enum.ADMIN, Enum.HR]), viewEmailTemplateController);
router.put('/updateEmailTemplate/:id', authorization, verifyRoles([Enum.ADMIN]),updateEmailTemplateController);
router.delete('/deleteEmailTemplate/:id', authorization,verifyRoles([Enum.ADMIN]), deleteEmailTemplateController);
router.get('/getAllEmailTemplates', authorization,verifyRoles([Enum.ADMIN, Enum.HR]), getAllEmailTemplatesController);
router.get('/templateByType/:type', authorization,verifyRoles([Enum.ADMIN]), getEmailTemplateByStatusController);

export default router;