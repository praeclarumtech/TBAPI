import express from 'express';
import {
  createSmsGroups,
  getAllSmsGroups,
  sendSMSToGroupMembers,
} from '../../controller/groupController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/create-group', authorization, createSmsGroups);
router.get('/all-groups', authorization, getAllSmsGroups);
router.post('/send-sms', authorization, sendSMSToGroupMembers);

export default router;
