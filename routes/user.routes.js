const express = require("express");
const {
  updateMe,
  updateUserByAdmin,
  getMe,
  getUser,
  deleteMe,
  getAllUsers,
  deleteUserByAdmin,
  resetUserPasswordByAdmin,
  resizeUserPhoto,
  uploadUserPhoto,
} = require("../controllers/users.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// User routes
router
  .route("/me")
  .get(getMe, getUser)
  .patch(uploadUserPhoto, resizeUserPhoto, updateMe)
  .delete(deleteMe);

// Admin-only routes
router.use(restrictTo("super-admin"));
router.get("/", getAllUsers);
router.get("/:id", getUser);
router.patch("/:id", uploadUserPhoto, resizeUserPhoto, updateUserByAdmin);
router.delete("/:id", deleteUserByAdmin);
router.patch("/:id/reset-password", resetUserPasswordByAdmin);

module.exports = router;
