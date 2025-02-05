import express from 'express';
import { register,login } from '../../controller/user.controller.js';
import { validator } from '../../helpers/validator.js';
import { registerValidation, loginValidation } from '../../validations/user.validation.js';

const router = express.Router();

router.post('/register',validator.body(registerValidation), register);
router.post('/login',validator.body(loginValidation), login);

export default router;
