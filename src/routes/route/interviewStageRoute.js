import express from 'express';
import {
    addInterviewStage,
    getinterviewStage,
    viewInterviewStageById,
    updateInterviewStages,
    deleteInterviewStage,
    deleteManyInterviewStage
} from '../../controller/interviewStageController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addInterviewStage', authorization, addInterviewStage);
router.get('/viewinterviewStage', authorization, getinterviewStage);
router.get('/viewInterviewStageById/:InterviewStageId',authorization,viewInterviewStageById);
router.put('/updateInterviewStages/:InterviewStageId', authorization, updateInterviewStages);
router.delete('/deleteInterviewStage/:id', authorization, deleteInterviewStage);
router.delete('/deleteManyInterviewStage', authorization, deleteManyInterviewStage);

export default router;
