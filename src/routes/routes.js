import express from "express";
import yearRoute from "./route/passingYearRoutes.js";
import userRouter from './route/userRoute.js';
import applicantRouter from './route/applicantRoute.js';
const router = express.Router();

router.use("/year", yearRoute);
router.use('/user', userRouter);
router.use('/user', applicantRouter);

export default router;
