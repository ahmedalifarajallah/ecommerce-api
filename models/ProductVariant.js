const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
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
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one image is required.",
      },
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
  },
  { _id: false },
);

module.exports = productVariantSchema;
