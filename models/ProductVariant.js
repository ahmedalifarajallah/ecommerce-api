const mongoose = require("mongoose");
const { generateSKU } = require("../utils/skuGenerator");

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

// auto-generate SKU and barCode and availability
productVariantSchema.pre("save", async function (next) {
  // Auto SKU
  if (!this.sku) {
    const Product = mongoose.model("Product");
    const product = await Product.findById(this.product).select("title");

    this.sku = generateSKU({
      title: product?.title,
      color: this.color,
      size: this.size,
      productId: this.product.toString(),
    });
  }

  // Auto barcode
  if (!this.barCode) {
    this.barCode = Math.floor(Math.random() * 1e12)
      .toString()
      .padStart(12, "0");
  }

  // Auto availability
  this.isAvailable = this.quantity > 0;

  next();
});

// auto update availability
productVariantSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.quantity !== undefined) {
    update.isAvailable = update.quantity > 0;
  }
  next();
});

productVariantSchema.index(
  { product: 1, color: 1, size: 1 },
  { unique: true, sparse: true }
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = ProductVariant;
