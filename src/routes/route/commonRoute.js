import express from 'express';
import { viewCountry } from '../../controller/commonController.js';

const router = express.Router();

router.get("/viewCountry", viewCountry);

export default router;
