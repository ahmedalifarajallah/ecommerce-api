const express = require("express");
const {
  createVariant,
  updateVariant,
  resizeVariantImgs,
  uploadVariantImgs,
  deleteVariant,
} = require("../controllers/productVariant.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadVariantImgs, resizeVariantImgs, createVariant);
router.patch("/:id", uploadVariantImgs, resizeVariantImgs, updateVariant);
router.delete("/:id", deleteVariant);

module.exports = router;
