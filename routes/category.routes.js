const express = require("express");
const {
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  createCategory,
  uploadCategoryImage,
} = require("../controllers/category.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategory);

router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadCategoryImage, createCategory);
router.patch("/:id", uploadCategoryImage, updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
