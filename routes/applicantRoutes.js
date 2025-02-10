

const express = require("express");
const { addApplicant, updateApplicant, deleteApplicant, viewApplicant,viewAllApplicants } = require("../controllers/applicantController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addApplicant);
router.put("/update/:id", protect, adminOnly, updateApplicant);
router.delete("/delete/:id", protect, adminOnly, deleteApplicant);
router.get("/view/:id", protect, viewApplicant);
router.get("/view", protect,viewAllApplicants);

// router.post("/add", addApplicant);
// router.put("/update/:id",  updateApplicant);
// router.delete("/delete/:id",  deleteApplicant);
// router.get("/view/:id",  viewApplicant);
// router.get("/view", viewAllApplicants);


module.exports = router;
