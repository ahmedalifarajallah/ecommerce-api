const express = require("express");
const {
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  createCategory,
  uploadCategoryImage,
  resizeCategoryImage,
} = require("../controllers/category.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategory);

router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadCategoryImage, resizeCategoryImage, createCategory);
router.patch("/:id", uploadCategoryImage, resizeCategoryImage, updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
