import express from 'express';
import { viewCountry,viewState } from '../../controller/commonController.js';

const router = express.Router();

router.get("/country", viewCountry);
router.get("/state", viewState);

export default router;
