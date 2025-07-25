import express from 'express';
import {
  adddesignations,
  getDesignation,
  getDesignationsById,
  updateDesignations,
  deleteDesignation,
  deleteManyDesignation
} from '../../controller/designationController.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/adddesignations',authorization, verifyRoles(['admin', 'hr']),adddesignations);
router.get('/viewDesignation', getDesignation);
router.get(
  '/getDesignationsById/:designationId',
  authorization,
  verifyRoles(['admin', 'hr']),
  getDesignationsById
);
router.put('/update/:designationId', verifyRoles(['admin']), authorization, updateDesignations);
router.delete('/deleteDesignation/:id', authorization, verifyRoles(['admin']), deleteDesignation);
router.delete('/deleteManyDesignation', authorization, verifyRoles(['admin']), deleteManyDesignation);

export default router;
