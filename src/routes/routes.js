import express from 'express';
import yearRoute from './route/passingYearRoutes.js';
import userRouter from './route/userRoute.js';
import applicantRouter from './route/applicantRoute.js';
import dashboardRouter from './route/dashboardRoute.js';
import countryRouter from './route/commonRoute.js'
const router = express.Router();

router.use('/year', yearRoute);
router.use('/user', userRouter);
router.use('/applicants', applicantRouter);
router.use('/dashboard', dashboardRouter);
router.use('/countryAndstates', countryRouter);

export default router;
