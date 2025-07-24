import express from 'express';
import {
  addAppliedRoleAndSkills,
  viewSkillsByAppliedRole,
  updateAppliedRoleAndSkill,
  deleteAppliedRoleAndSkill,
  getSkillsById,
  ViewAllSkillAndAppliedRole,
  findAndReplaceSkillOrAppliedRole,
  previewFindSkillOrAppliedRole,
} from '../../controller/appliedRoleController.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addAppliedRoleAndSkills', authorization,  addAppliedRoleAndSkills);
router.get('/viewSkillsByAppliedRole', viewSkillsByAppliedRole);
router.get('/ViewAllSkillAndAppliedRole', authorization,  ViewAllSkillAndAppliedRole);
router.get('/viewskillAndAppliedRoleById/:id', authorization,  getSkillsById);
router.put('/updateAppliedRoleAndSkill/:id', authorization,  updateAppliedRoleAndSkill);
router.delete('/deleteAppliedRoleAndSkill/:id', authorization,  deleteAppliedRoleAndSkill);
router.put('/skillOrAppliedRoleReplaceAll', authorization,  findAndReplaceSkillOrAppliedRole);
router.post('/findSkillOrAppliedRole', authorization,  previewFindSkillOrAppliedRole);

export default router;
