const mongoose = require("mongoose");
const slugify = require("slugify");
const { seoSchema } = require("./Seo");
const productVariantSchema = require("./ProductVariant");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    shortDescription: String,
    main_image: {
      type: String,
    },
    minPrice: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
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
    variants: {
      type: [productVariantSchema],
      validate: (v) => v.length > 0,
    },
    isAvailable: { type: Boolean, default: true },
    slug: { type: String, index: true, unique: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    seo: seoSchema,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Product Slug
productSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Product Min Price and Total Stock
productSchema.pre("save", function (next) {
  if (this.variants?.length) {
    // Set isAvailable per variant
    this.variants.forEach((v) => {
      v.isAvailable = v.quantity > 0;
    });

    // Set minPrice
    this.minPrice = Math.min(
      ...this.variants.map((v) => v.discountPrice || v.price),
    );

    // Set totalStock
    this.totalStock = this.variants.reduce((sum, v) => sum + v.quantity, 0);

    // Product-level availability
    this.isAvailable = this.variants.some((v) => v.isAvailable);
  }
  next();
});

// Product Index
productSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});
productSchema.index({ slug: 1 });
productSchema.index({ categories: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
