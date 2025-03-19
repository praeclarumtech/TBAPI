import express from 'express';
import { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById, importSkillsCsv } from '../../controller/skillsController.js';
import { skillsValidation } from '../../validations/skillsValidation.js';
import { validator } from '../../helpers/validator.js';

const router = express.Router();

router.post('/addSkills', validator.body(skillsValidation), addSkills);
router.get('/viewSkills', getSkills);
router.get('/viewById/:skillId', getSkillsById);
router.put('/update/:skillId', validator.body(skillsValidation), updateSkills);
router.delete('/delete/:skillId', deleteSkills);

// import csv
router.post('/importCsv', importSkillsCsv);
export default router;
