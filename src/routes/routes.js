import express from 'express';
import yearRoute from './route/passingYearRoutes.js';
import userRouter from './route/userRoute.js';
import applicantRouter from './route/applicantRoute.js';
import dashboardRouter from './route/dashboardRoute.js';
const router = express.Router();

router.use('/year', yearRoute);
router.use('/user', userRouter);
router.use('/applicants', applicantRouter);
router.use('/dashboard', dashboardRouter);

export default router;
