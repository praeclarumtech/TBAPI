import express from 'express';
import { viewCountry,viewState,viewCity} from '../../controller/commonController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/country', authorization, viewCountry);
router.get('/state', authorization, viewState);
router.get('/city', authorization, viewCity);

export default router;
