import express from 'express';
import { createProfile,viewProfile, updateProfile, upload } from '../../controller/profileController.js';
import { authorization } from '../../helpers/user.middleware.js'; // Auth Middleware

const router = express.Router();

router.get('/viewProfile', authorization, viewProfile);
router.post('/createProfile', authorization, createProfile);

router.put('/updateProfile', authorization, upload, updateProfile);

export default router;
