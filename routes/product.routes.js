const express = require("express");
const {
  getAllProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  uploadProductImgs,
  resizeProductImgs,
} = require("../controllers/product.controller");
const productVariantRoutes = require("./productVariant.routes");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin routes
router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadProductImgs, resizeProductImgs, addProduct);

router.patch("/:id", uploadProductImgs, resizeProductImgs, updateProduct);

router.delete("/:id", deleteProduct);

router.use("/:productId/variants", productVariantRoutes);

module.exports = router;
