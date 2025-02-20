import express from 'express';
import yearRoute from './route/passingYearRoutes.js';
import userRouter from './route/userRoute.js';
import applicantRouter from './route/applicantRoute.js';
import applicantEmailRouter from './route/applicantEmailRoute.js'
import skillsRoute from './route/skillsRoute.js'
import dashboardRouter from './route/dashboardRoute.js';
import countryRouter from './route/commonRoute.js';
import reportsRouter from './route/reportsRoute.js';
const router = express.Router();

router.use('/year', yearRoute);
router.use('/user', userRouter);
router.use('/applicantEmail',applicantEmailRouter);
router.use('/skill', skillsRoute);
router.use('/applicants', applicantRouter);
router.use('/dashboard/applicant', dashboardRouter);
router.use('/reports/applicants', reportsRouter);
router.use('/', countryRouter);

export default router;
