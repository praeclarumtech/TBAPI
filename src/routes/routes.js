import express from "express";
import userRouter from "./route/userRoute.js";
import profileRouter from './route/profileRoute.js'
const router = express.Router();

router.use("/user", userRouter);
router.use("/user", profileRouter);

export default router;
