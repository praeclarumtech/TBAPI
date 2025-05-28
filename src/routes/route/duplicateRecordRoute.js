import express from 'express';
import { viewAllDuplicateRecord, deleteManyDuplicatrecords } from '../../controller/duplicateRecordController.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.get('/duplicate-record', authorization, viewAllDuplicateRecord);
router.delete('/delete/duplicate-record', authorization, deleteManyDuplicatrecords);

export default router;
