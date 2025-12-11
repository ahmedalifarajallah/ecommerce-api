const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },
  variantName: { type: String, trim: true },
  color: { type: String, trim: true, lowercase: true },
  size: { type: String, trim: true, lowercase: true },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: 0,
    validate: {
      validator: function (val) {
        return val <= this.price;
      },
      message: "Discount price cannot be greater than the original price.",
    },
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length > 0;
      },
      message: "At least one image is required.",
    },
  },
  weight: {
    type: Number,
    min: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  barCode: {
    type: String,
    unique: true,
    sparse: true, // prevents duplicate null problem
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

productVariantSchema.index(
  { product: 1, color: 1, size: 1 },
  { unique: true, sparse: true }
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;
