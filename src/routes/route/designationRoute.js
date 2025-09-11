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
import {Enum} from '../../utils/enum.js';

const router = express.Router();

router.post('/adddesignations',authorization, verifyRoles([Enum.ADMIN, Enum.HR]),adddesignations);
router.get('/viewDesignation', getDesignation);
router.get(
  '/getDesignationsById/:designationId',
  authorization,
  verifyRoles([Enum.ADMIN, Enum.HR]),
  getDesignationsById
);
router.put('/update/:designationId', verifyRoles([Enum.ADMIN]), authorization, updateDesignations);
router.delete('/deleteDesignation/:id', authorization, verifyRoles([Enum.ADMIN]), deleteDesignation);
router.delete('/deleteManyDesignation', authorization, verifyRoles([Enum.ADMIN]), deleteManyDesignation);

export default router;
