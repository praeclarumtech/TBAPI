import express from 'express';
import { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById, importSkillsCsv } from '../../controller/skillsController.js';
import { skillsValidation } from '../../validations/skillsValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addSkills', authorization, verifyRoles(['admin', 'hr']), validator.body(skillsValidation), addSkills);
router.get('/viewSkills', getSkills);
// for dashboard
router.get('/dashboard/viewSkills', getSkills);
router.get('/viewById/:skillId', authorization, verifyRoles(['admin', 'hr']), getSkillsById);
router.put('/update/:skillId', authorization, verifyRoles(['admin']), validator.body(skillsValidation), updateSkills);
router.delete('/delete/:skillId', authorization, verifyRoles(['admin']), deleteSkills);

// import csv
router.post('/importCsv', authorization, importSkillsCsv);
export default router;
