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
import {Enum} from '../../utils/enum.js'

const router = express.Router();

router.post('/addAppliedRoleAndSkills', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), addAppliedRoleAndSkills);
router.get('/viewSkillsByAppliedRole', viewSkillsByAppliedRole);
router.get('/ViewAllSkillAndAppliedRole', ViewAllSkillAndAppliedRole);
router.get('/viewskillAndAppliedRoleById/:id', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), getSkillsById);
router.put('/updateAppliedRoleAndSkill/:id', authorization, verifyRoles([Enum.ADMIN]), updateAppliedRoleAndSkill);
router.delete('/deleteAppliedRoleAndSkill/:id', authorization, verifyRoles([Enum.ADMIN]), deleteAppliedRoleAndSkill);
router.put('/skillOrAppliedRoleReplaceAll', authorization, verifyRoles([Enum.ADMIN]), findAndReplaceSkillOrAppliedRole);
router.post('/findSkillOrAppliedRole', authorization, verifyRoles([Enum.ADMIN]), previewFindSkillOrAppliedRole);

export default router;
