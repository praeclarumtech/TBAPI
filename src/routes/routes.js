import express from 'express';
import yearRoute from './route/passingYearRoutes.js';
import userRouter from './route/userRoute.js';
import applicantRouter from './route/applicantRoute.js';
import applicantEmailRouter from './route/applicantEmailRoute.js'
import skillsRoute from './route/skillsRoute.js'
import degreeRoute from './route/degreeRoute.js'
import dashboardRouter from './route/dashboardRoute.js';
import countryRouter from './route/commonRoute.js';
import reportsRouter from './route/reportsRoute.js';
import appliedRoleRouter from './route/appliedRoleRoute.js'
import applicantEmailTempletRouter from './route/emailTemplateRoute.js'
import designationRouter from './route/designationRoute.js'
import duplicateRecordRouter from './route/duplicateRecordRoute.js'
const router = express.Router();

router.use('/year', yearRoute);
router.use('/user', userRouter);
router.use('/email/applicant', applicantEmailRouter);
router.use('/skill', skillsRoute);
router.use('/degree', degreeRoute);
router.use('/applicants', applicantRouter);
router.use('/dashboard/applicant', dashboardRouter);
router.use('/reports/applicants', reportsRouter);
router.use('/appliedRole', appliedRoleRouter);
router.use('/', countryRouter);
router.use('/email/template', applicantEmailTempletRouter);
router.use('/designation', designationRouter);
router.use('/duplicateRecord', duplicateRecordRouter);
export default router;
