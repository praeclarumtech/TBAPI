import express from 'express';
import {
  addApplicant,
  viewAllApplicant,
  viewApplicant,
  updateApplicant,
  deleteApplicant,
} from '../../controller/applicantController.js';
import { applicantValidation } from '../../validations/applicantValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/user.middleware.js';

const router = express.Router();

// router.post('/addApplicant',authorization,validator.body(applicantValidation),addApplicant);
// router.get('/viewAllApplicant',authorization, viewAllApplicant);
// router.get('/viewApplicant/:id',authorization, viewApplicant);
// router.put('/updateApplicant/:id',authorization,validator.body(applicantValidation), updateApplicant);
// router.delete('/deleteApplicant/:id',authorization, deleteApplicant);/

router.post('/addApplicant',validator.body(applicantValidation),addApplicant);
router.get('/viewAllApplicant', viewAllApplicant);
router.get('/viewApplicant/:id', viewApplicant);
router.put('/updateApplicant/:id',validator.body(applicantValidation), updateApplicant);
router.delete('/deleteApplicant/:id', deleteApplicant);

export default router;
