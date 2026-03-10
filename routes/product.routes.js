const express = require("express");
const {
  getAllProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  uploadProductImgs,
} = require("../controllers/product.controller");
const productVariantRoutes = require("./productVariant.routes");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin routes
router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadProductImgs, addProduct);

router.patch("/:id", uploadProductImgs, updateProduct);

router.delete("/:id", deleteProduct);

router.use("/:productId/variants", productVariantRoutes);

module.exports = router;
