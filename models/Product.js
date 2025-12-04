const mongoose = require("mongoose");
const slugify = require("slugify");
const { seoSchema } = require("./Seo");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    shortDescription: String,
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
      validate: {
        validator: function (val) {
          return val <= this.price;
        },
        message: "Discount price cannot be greater than price",
      },
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
    slug: { type: String, index: true, unique: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    seo: seoSchema,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Product Slug
productSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Product Variants
productSchema.virtual("variants", {
  ref: "ProductVariant",
  foreignField: "product",
  localField: "_id",
});

// populate variants
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "variants",
  });
  next();
});

// Product Reviews
// productSchema.virtual("reviews", {
//   ref: "Review",
//   foreignField: "product",
//   localField: "_id",
// });

// Product Variants
productSchema.pre("findOneAndDelete", async function (next) {
  const ProductVariant = mongoose.model("ProductVariant");
  await ProductVariant.deleteMany({ product: this._conditions._id });
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
