import express from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  deleteTrainingApplication,
  listTrainingApplications,
  submitTrainingApplication,
  updateTrainingApplication,
  viewTrainingApplication,
} from '../../controller/trainingApplicationController.js';
import { trainingApplicationValidation } from '../../validations/trainingApplicationValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';
import { Enum, PermissionKey } from '../../utils/enum.js';
import { Message } from '../../utils/constant/message.js';

const router = express.Router();

const canViewTrainingApplications = (req, res, next) => {
  const role = req.user?.role;
  const modules = req.user?.accessModules || [];
  const allowed =
    role === Enum.ADMIN ||
    role === Enum.HR ||
    modules.includes(PermissionKey.TRAINING_APPLICATIONS) ||
    modules.includes(PermissionKey.APPLICANTS);

  if (!allowed) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      statusCode: StatusCodes.FORBIDDEN,
      message: `${Message.ACCESS_DENIED} you do not have permission to access this resource.`,
    });
  }
  return next();
};

router.post(
  '/',
  validator.body(trainingApplicationValidation),
  submitTrainingApplication
);

router.get('/', authorization, canViewTrainingApplications, listTrainingApplications);
router.get(
  '/:id',
  authorization,
  canViewTrainingApplications,
  viewTrainingApplication
);
router.put(
  '/:id',
  authorization,
  canViewTrainingApplications,
  validator.body(trainingApplicationValidation),
  updateTrainingApplication
);
router.delete(
  '/:id',
  authorization,
  canViewTrainingApplications,
  deleteTrainingApplication
);

export default router;
