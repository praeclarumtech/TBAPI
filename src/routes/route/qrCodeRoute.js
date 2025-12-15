import express from 'express';
import { sendQRCodeInvite } from '../../controller/qrCodeController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import { Enum } from '../../utils/enum.js';

const router = express.Router();

// Send QR code invite to client or vendor (Admin only)
router.post(
  '/send-invite',
  authorization,
  verifyRoles([Enum.ADMIN]),
  sendQRCodeInvite
);

export default router;
