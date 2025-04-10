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

const router = express.Router();

router.post('/addAppliedRoleAndSkills', addAppliedRoleAndSkills);
router.get('/viewSkillsByAppliedRole', viewSkillsByAppliedRole);
router.get('/ViewAllSkillAndAppliedRole', ViewAllSkillAndAppliedRole);
router.get('/viewskillAndAppliedRoleById/:id', getSkillsById);
router.put('/updateAppliedRoleAndSkill/:id', updateAppliedRoleAndSkill);
router.delete('/deleteAppliedRoleAndSkill/:id', deleteAppliedRoleAndSkill);
router.put('/skillOrAppliedRoleReplaceAll', findAndReplaceSkillOrAppliedRole);
router.post('/findSkillOrAppliedRole', previewFindSkillOrAppliedRole);

export default router;
