import express from 'express';
import { register,login } from '../../controller/user.controller.js';
import { validator } from '../../helpers/validator.js';
import { registerValidation, loginValidation } from '../../validations/user.validation.js';

const router = express.Router();


router.post('/register', (req, res, next) => {
    console.log("Request Body: ", req.body);
    next();
  }, validator.body(registerValidation), register);
  

router.post('/login', (req, res, next) => {
    console.log("Login Request Body: ", req.body);
    next();
  }, validator.body(loginValidation), login);
  

export default router;
