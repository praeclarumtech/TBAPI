import express from "express";
import yearRoute from "./route/passingYearRoutes.js";
import userRouter from './route/userRoute.js';

const router = express.Router();

router.use("/year", yearRoute);
router.use('/user', userRouter);

export default router;
