const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    main_image: {
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
    categories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    slug: { type: String, unique: true },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Product Variants
productSchema.virtual("variants", {
  ref: "ProductVariant",
  foreignField: "product",
  localField: "_id",
});

// Product Slug
productSchema.pre("save", function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Product Reviews
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

// Product Index
productSchema.index({ title: "text", slug: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

/**
 * Images saved even if there is an error and product not saved
 *
 */
