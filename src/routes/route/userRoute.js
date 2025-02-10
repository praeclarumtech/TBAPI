import express from 'express';
import {
  register,
  login,
  viewProfile,
  updateProfile,
  viewProfileById,
} from '../../controller/user.controller.js';
import { validator } from '../../helpers/validator.js';
import {
  registerValidation,
  loginValidation,
} from '../../validations/user.validation.js';
import { upload } from '../../helpers/Multer.js';
import { authorization } from '../../helpers/user.middleware.js';

const router = express.Router();

router.post('/register', validator.body(registerValidation), register);

router.post('/login', validator.body(loginValidation), login);

router.get('/viewProfile', authorization, viewProfile);
router.get('/viewProfile/viewProfileById/:id', authorization, viewProfileById);
router.put('/updateProfile/:id', authorization, upload, updateProfile);

export default router;
