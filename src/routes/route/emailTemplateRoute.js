import express from 'express';
import {
  createEmailTemplateController,
  viewEmailTemplateController,
  updateEmailTemplateController,
  deleteEmailTemplateController,
  getAllEmailTemplatesController,
  getEmailTemplateByStatusController
} from '../../controller/applicantEmailTempletController.js';
import { authorization } from '../../helpers/userMiddleware.js'

const router = express.Router();

router.post('/createEmailTemplate', authorization, createEmailTemplateController);
router.get('/viewEmailTemplate/:id', authorization, viewEmailTemplateController);
router.put('/updateEmailTemplate/:id', authorization, updateEmailTemplateController);
router.delete('/deleteEmailTemplate/:id', authorization, deleteEmailTemplateController);
router.get('/getAllEmailTemplates', authorization, getAllEmailTemplatesController);
router.get('/templateByType/:type', authorization, getEmailTemplateByStatusController);

export default router;