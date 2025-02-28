import express from 'express';
import { createWhatsAppGroups, getAllWhatsAppGroups } from '../../controller/whatsappController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/create-group',authorization, createWhatsAppGroups);
router.get('/all-groups',authorization, getAllWhatsAppGroups);

export default router;
