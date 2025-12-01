const mongoose = require("mongoose");

// Product_Variants Schema
const productVariantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
  },
  variantName: {
    type: String,
  },
  color: {
    type: String,
  },
  size: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  images: {
    type: [String],
    required: true,
  },
  weight: {
    type: Number,
    min: 0,
  },
  sku: {
    type: String,
    unique: true,
  },
  barCode: {
    type: String,
    unique: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

productVariantSchema.pre("save", function (next) {
  if (!this.sku) {
    this.sku = `SKU-${Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()}`;
  }

  if (!this.barcode) {
    this.barcode = Math.floor(Math.random() * 1e12)
      .toString()
      .padStart(12, "0");
  }

  next();
});

productVariantSchema.index({ product: 1 });

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;
