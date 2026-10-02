import express from 'express';
import {
  addTrainingTechnology,
  deleteTrainingTechnology,
  listTrainingTechnologies,
  updateTrainingTechnology,
} from '../../controller/trainingTechnologyController.js';
import { trainingTechnologyValidation } from '../../validations/trainingTechnologyValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import { Enum } from '../../utils/enum.js';

const router = express.Router();
const adminOnly = [authorization, verifyRoles([Enum.ADMIN])];

router.get('/', listTrainingTechnologies);
router.post('/', ...adminOnly, validator.body(trainingTechnologyValidation), addTrainingTechnology);
router.put(
  '/:id',
  ...adminOnly,
  validator.body(trainingTechnologyValidation),
  updateTrainingTechnology
);
router.delete('/:id', ...adminOnly, deleteTrainingTechnology);

export default router;
