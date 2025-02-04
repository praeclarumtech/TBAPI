import express from "express";
import { register } from "../../controller/user.controller.js";
import { uservalidation } from "../../validations/user.validation.js";
const router = express.Router();

router.post("/register", uservalidation, register);

export default router;
