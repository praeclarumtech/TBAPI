import express from 'express';
import {
  adddesignations,
  getDesignation,
  getDesignationsById,
  updateDesignations,
  deleteDesignation,
  deleteManyDesignation
} from '../../controller/designationController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/adddesignations', authorization, adddesignations);
router.get('/viewDesignation', authorization, getDesignation);
router.get(
  '/getDesignationsById/:designationId',
  authorization,
  getDesignationsById
);
router.put('/update/:designationId', authorization, updateDesignations);
router.delete('/deleteDesignation/:id', authorization, deleteDesignation);
router.delete('/deleteManyDesignation', authorization, deleteManyDesignation);

export default router;
