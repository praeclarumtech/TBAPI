import express from 'express';
import userRouter from './route/userRoute.js';
const router = express.Router();

router.use('/user', userRouter);

export default router;
