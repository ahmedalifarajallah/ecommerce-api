const express = require("express");
const {
  getAllProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  uploadProductMainImage,
  resizeProductMainImage,
} = require("../controllers/product.controller");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();
// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin routes
router.use(protect, restrictTo("super-admin", "admin"));

router.post("/", uploadProductMainImage, resizeProductMainImage, addProduct);

router.patch(
  "/:id",
  uploadProductMainImage,
  resizeProductMainImage,
  updateProduct
);

router.delete("/:id", deleteProduct);

module.exports = router;
