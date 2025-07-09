import express from 'express';
import {
  register,
  login,
  updateProfile,
  viewProfileById,
  sendEmail,
  verifyOtp,
  forgotPassword,
  changePassword,
  getProfileByToken,
  updateStatus,
  listOfUsers,
} from '../../controller/userController.js';
import { validator } from '../../helpers/validator.js';
import {
  registerValidation,
  loginValidation,
  sendEmailValidation,
  forgotPasswordValidation,
  changePasswordValidation,
} from '../../validations/userValidation.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

//for other role like vendor,hr,guest
router.post('/register', validator.body(registerValidation), register);

//for admin only to create users
router.post('/create', authorization, verifyRoles(['admin']), validator.body(registerValidation), register);

router.post('/login', validator.body(loginValidation), login);

router.get('/listOfUsers', authorization, verifyRoles(['admin']), listOfUsers);
router.get('/getProfileByToken', authorization, getProfileByToken);
router.get('/viewProfileByID/:id', authorization, viewProfileById);
router.put('/updateProfile/:id', authorization, updateProfile);
router.post('/sendEmail', validator.body(sendEmailValidation), sendEmail);
router.post('/sendEmail/verifyOtp', verifyOtp);
router.put('/forgotPassword', validator.body(forgotPasswordValidation), forgotPassword);
router.post('/changePassword/:id', authorization, validator.body(changePasswordValidation), changePassword);
router.put('/updateStatus/:id', authorization, verifyRoles(['admin']), updateStatus);

export default router;

