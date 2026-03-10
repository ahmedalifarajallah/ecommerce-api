const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  attributes: {
    type: Map,
    of: String, // color, size, material, etc.
    required: true,
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
    required: false,
    default: [],
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

productVariantSchema.pre("save", function (next) {
  this.isAvailable = this.quantity > 0;
  next();
});

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);
module.exports = ProductVariant;
