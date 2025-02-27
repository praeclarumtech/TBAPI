import express from 'express';
import { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById } from '../../controller/skillsController.js';
import { skillsValidation, validateId } from '../../validations/skillsValidation.js';
import { validator } from '../../helpers/validator.js';
import { authorization } from '../../helpers/userMiddleware.js';
const router = express.Router();

router.post('/addSkills', authorization, validator.body(skillsValidation), addSkills);
router.get('/viewSkills', getSkills);
router.get('/viewById/:skillId', validator.params(validateId), getSkillsById);
router.put('/update/:skillId', validator.params(validateId), validator.body(skillsValidation), updateSkills);
router.delete('/delete/:skillId', validator.params(validateId), deleteSkills);

export default router;
