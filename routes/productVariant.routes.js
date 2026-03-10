const express = require("express");
const {
  createVariant,
  updateVariant,
  uploadVariantImgs,
  deleteVariant,
} = require("../controllers/productVariant.controller");
const { protect, restrictTo } = require("../middleware/auth");
const catchAsync = require("../utils/catchAsync");
const Product = require("../models/Product");

const router = express.Router({ mergeParams: true });

router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadVariantImgs, createVariant);
router.patch("/:id", uploadVariantImgs, updateVariant);
router.delete(
  "/:id",
  catchAsync(async (req, res, next) => {
    try {
      const { productId, id } = req.params;
      const product = await Product.findById(productId);
      if (!product)
        return next(new AppError("No product found with that ID", 404));
      const variant = product.variants.find((v) => v._id.toString() === id);
      if (!variant)
        return next(new AppError("No variant found with that ID", 404));

      await deleteVariant({
        productId,
        variants: [variant],
      });
      res.status(204).json({
        status: "success",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }),
);

module.exports = router;
