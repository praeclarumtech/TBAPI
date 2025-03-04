import express from 'express';
import { viewCountry,viewState,viewCity} from '../../controller/commonController.js';

const router = express.Router();

router.get('/country', viewCountry);
router.get('/state', viewState);
router.get('/city', viewCity);

export default router;
