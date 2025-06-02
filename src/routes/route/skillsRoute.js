import express from 'express';
import { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById, importSkillsCsv } from '../../controller/skillsController.js';
import { skillsValidation } from '../../validations/skillsValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';

const router = express.Router();

router.post('/addSkills', authorization, validator.body(skillsValidation), addSkills);
router.get('/viewSkills', getSkills);
router.get('/viewById/:skillId', authorization, getSkillsById);
router.put('/update/:skillId', authorization, validator.body(skillsValidation), updateSkills);
router.delete('/delete/:skillId', authorization, deleteSkills);

// import csv
router.post('/importCsv', authorization, importSkillsCsv);
export default router;
