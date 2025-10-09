import express from 'express';
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRole,
} from '../../controller/roleController.js';

const router = express.Router();

router.post('/create', createRole);
router.get('/list', getRoles);
router.get('/view/:id', getRoleById);
router.put('/update/:id', updateRole);
router.put('/assign/:id', assignRole);
router.delete('/delete/:id', deleteRole);

export default router;
