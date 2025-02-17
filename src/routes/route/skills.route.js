
const { addSkills, getSkills, updateSkills, deleteSkills, getSkillsById } = require('../../controller/skills.controller');
const express = require("express");

const router = express.Router();


router.post("/", addSkills);
router.post("/listOfSkills", getSkills);
router.get("/:skillId", getSkillsById);
router.put("/skillId/:id", updateSkills);
router.delete("/:skillId", deleteSkills);

module.exports = router;