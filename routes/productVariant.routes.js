const express = require("express");
const {
  createVariant,
  updateVariant,
  resizeVariantImgs,
  uploadVariantImgs,
} = require("../controllers/productVariant.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadVariantImgs, resizeVariantImgs, createVariant);
router.patch("/:id", uploadVariantImgs, resizeVariantImgs, updateVariant);

module.exports = router;
