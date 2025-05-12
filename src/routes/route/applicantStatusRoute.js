import express from 'express';
import {
    addApplicantStatus,
    getApplicantStatuse,
    viewApplicantStatusById,
    updateApplicantStatuses,
    deleteApplicantStatus,
    deleteManyApplicantStatus
} from '../../controller/applicantStatusController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addApplicantStatus', authorization, addApplicantStatus);
router.get('/viewApplicantStatus', authorization, getApplicantStatuse);
router.get('/viewApplicantStatusById/:ApplicantStatusId', authorization, viewApplicantStatusById);
router.put('/updateApplicantStatus/:ApplicantStatusId', authorization, updateApplicantStatuses);
router.delete('/deleteApplicantStatus/:id', authorization, deleteApplicantStatus);
router.delete('/deleteManyApplicantStatus', authorization, deleteManyApplicantStatus);

export default router;
