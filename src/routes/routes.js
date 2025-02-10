import express from "express";
import yearRoute from "./route/passingYearRoutes.js";

const router = express.Router();

router.use("/year", yearRoute);

export default router;
