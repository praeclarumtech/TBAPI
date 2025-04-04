import express from 'express';
import {
  register,
  login,
  viewProfile,
  updateProfile,
  viewProfileById,
  sendEmail,
  verifyOtp,
  forgotPassword,
  changePassword,
  getProfileByToken,
} from '../../controller/userController.js';
import { validator } from '../../helpers/validator.js';
import {
  registerValidation,
  loginValidation,
  sendEmailValidation,
  forgotPasswordValidation,
  changePasswordValidation
} from '../../validations/userValidation.js';
import { upload } from '../../helpers/multer.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/register', validator.body(registerValidation), register);
router.post('/login', validator.body(loginValidation), login);

router.get('/viewProfile', authorization, viewProfile);
router.get('/getProfileByToken', authorization, getProfileByToken);
router.get('/viewProfileByID/:id', authorization, viewProfileById);
router.put('/updateProfile/:id', authorization, upload, updateProfile);
router.post('/sendEmail',validator.body(sendEmailValidation),sendEmail);
router.post('/sendEmail/verifyOtp',verifyOtp);
router.put('/forgotPassword',validator.body(forgotPasswordValidation),forgotPassword);
router.post('/changePassword/:id',validator.body(changePasswordValidation), changePassword);

export default router;
