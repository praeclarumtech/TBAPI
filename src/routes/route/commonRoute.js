import express from 'express';
import { viewCountry,viewState } from '../../controller/commonController.js';

const router = express.Router();

router.get("/viewCountry", viewCountry);
router.get("/viewState", viewState);

export default router;
