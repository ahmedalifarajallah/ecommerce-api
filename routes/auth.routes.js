const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendOTP,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// -------------------- PUBLIC ROUTES -------------------- //
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

// -------------------- PROTECTED ROUTES -------------------- //
router.use(protect);
router.get("/logout", logout);
router.patch("/update-password", updatePassword);

module.exports = router;

/**
 * TODO:
 * - Add email verification **DONE**
 * - create API Filter **SEMI-DONE**
 * - Implement APi Filter to user controllers **SEMI-DONE**
 * - create handleFactory controller
 */
