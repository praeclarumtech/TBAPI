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
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addAppliedRoleAndSkills', authorization, verifyRoles(['admin', 'hr']), addAppliedRoleAndSkills);
router.get('/viewSkillsByAppliedRole', viewSkillsByAppliedRole);
router.get('/ViewAllSkillAndAppliedRole', ViewAllSkillAndAppliedRole);
router.get('/viewskillAndAppliedRoleById/:id', authorization, verifyRoles(['admin', 'hr']), getSkillsById);
router.put('/updateAppliedRoleAndSkill/:id', authorization, verifyRoles(['admin']), updateAppliedRoleAndSkill);
router.delete('/deleteAppliedRoleAndSkill/:id', authorization, verifyRoles(['admin']), deleteAppliedRoleAndSkill);
router.put('/skillOrAppliedRoleReplaceAll', authorization, verifyRoles(['admin']), findAndReplaceSkillOrAppliedRole);
router.post('/findSkillOrAppliedRole', authorization, verifyRoles(['admin']), previewFindSkillOrAppliedRole);

export default router;
