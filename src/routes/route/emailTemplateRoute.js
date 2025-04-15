import express from 'express';
import {
  createEmailTemplateController,
  viewEmailTemplateController,
  updateEmailTemplateController,
  deleteEmailTemplateController,
  getAllEmailTemplatesController,
  getEmailTemplateByStatusController
} from '../../controller/applicantEmailTempletController.js';

const router = express.Router();
 
router.post('/createEmailTemplate',  createEmailTemplateController);
router.get('/viewEmailTemplate/:id', viewEmailTemplateController);
router.put('/updateEmailTemplate/:id', updateEmailTemplateController);
router.delete('/deleteEmailTemplate/:id',deleteEmailTemplateController);
router.get('/getAllEmailTemplates', getAllEmailTemplatesController);
router.get('/templateByType/:type', getEmailTemplateByStatusController);
 
export default router;