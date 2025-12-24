import express from 'express';
import {
  getAllSettings,
  updateAllSettings,
  updateDateTime,
  updateTemplateVisibility,
  getTemplatesForContext,
} from '../../controller/settingsController.js';
import {
  settingsValidation,
  dateTimeValidation,
  emailTemplateVisibilityValidation,
} from '../../validations/settingsValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import { Enum } from '../../utils/enum.js';
import { cacheMiddleware } from '../../helpers/commonFunction/cacheMiddleware.js';

const router = express.Router();

// Get all settings
router.get(
  '/',
  cacheMiddleware('settings'),
  authorization,
  verifyRoles([Enum.ADMIN, Enum.HR]),
  getAllSettings
);

// Update all settings
router.put(
  '/',
  authorization,
  verifyRoles([Enum.ADMIN]),
  validator.body(settingsValidation),
  updateAllSettings
);

// Update date & time settings only
router.put(
  '/date-time',
  authorization,
  verifyRoles([Enum.ADMIN]),
  validator.body(dateTimeValidation),
  updateDateTime
);

// Update email template visibility
router.put(
  '/email-template-visibility',
  authorization,
  verifyRoles([Enum.ADMIN]),
  validator.body(emailTemplateVisibilityValidation),
  updateTemplateVisibility
);

// Get visible templates for a specific context (vendor, client, job, qrCode, custom)
router.get(
  '/templates/:context',
  cacheMiddleware('settings-templates'),
  authorization,
  verifyRoles([Enum.ADMIN, Enum.HR, Enum.VENDOR, Enum.CLIENT]),
  getTemplatesForContext
);

export default router;
