import express from 'express';
import { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById, importSkillsCsv } from '../../controller/skillsController.js';
import { skillsValidation } from '../../validations/skillsValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization, verifyRoles } from '../../helpers/userMiddleware.js';
import {Enum} from '../../utils/enum.js'


const router = express.Router();

router.post('/addSkills', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), validator.body(skillsValidation), addSkills);
router.get('/viewSkills', getSkills);
// for dashboard
router.get('/dashboard/viewSkills', getSkills);
router.get('/viewById/:skillId', authorization, verifyRoles([Enum.ADMIN, Enum.HR]), getSkillsById);
router.put('/update/:skillId', authorization, verifyRoles([Enum.ADMIN]), validator.body(skillsValidation), updateSkills);
router.delete('/delete/:skillId', authorization, verifyRoles([Enum.ADMIN]), deleteSkills);

// import csv
router.post('/importCsv', authorization, importSkillsCsv);
export default router;
