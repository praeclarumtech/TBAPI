import express from "express";
import {
  createProfile,
  viewProfile,
  updateProfile,
  upload,
  viewProfileById,
} from "../../controller/profileController.js";
import { authorization } from "../../helpers/user.middleware.js"; // Auth Middleware

const router = express.Router();

router.get("/viewProfile", authorization, viewProfile);
router.get("/viewProfile/viewProfileById/:id", authorization, viewProfileById);
router.post("/createProfile", authorization, upload, createProfile);

router.put("/updateProfile/:id", authorization, upload, updateProfile);

export default router;
