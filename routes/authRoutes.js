const express = require("express");
const {
    registerUser,
    login,
    changePassword,
    forgotPassword,
    resetPassword,
  } = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
