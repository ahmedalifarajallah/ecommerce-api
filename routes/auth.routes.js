const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require("../controllers/auth.controller");
const { getMe, getUser } = require("../controllers/users.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// -------------------- PUBLIC ROUTES -------------------- //
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

// -------------------- PROTECTED ROUTES -------------------- //
router.get("/me", protect, getMe, getUser);
router.patch("/me/update-password", protect, updatePassword);

// -------------------- ROLE-BASED ROUTES -------------------- //

module.exports = router;
