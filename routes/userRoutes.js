const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/dashboard", protect, (req, res) => {
  res.json({ message: "Welcome to User Dashboard" });
});

router.get("/admin-dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard" });
});

module.exports = router;
