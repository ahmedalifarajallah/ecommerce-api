const mongoose = require("mongoose");
const slugify = require("slugify");
const { seoSchema } = require("./Seo");
const ProductVariant = require("./ProductVariant");

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
    isAvailable: { type: Boolean, default: true },
    slug: { type: String, unique: true },
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

// Virtual populate for variants
productSchema.virtual("variants", {
  ref: "ProductVariant",
  localField: "_id",
  foreignField: "product",
});

productSchema.pre(/^find/, function (next) {
  this.populate("variants").populate("categories");
  next();
});

// Product Min Price and Total Stock
productSchema.methods.updateAggregates = async function (session) {
  const variants = await mongoose
    .model("ProductVariant")
    .find({ product: this._id }, null, { session });

  this.minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => v.discountPrice || v.price))
      : 0;

  this.totalStock = variants.reduce((sum, v) => sum + v.quantity, 0);
  this.isAvailable = variants.some((v) => v.quantity > 0);

  await this.save({ session });
};

// Product Index
productSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});
// productSchema.index({ slug: 1 }); // Removed to fix duplicate index warning
productSchema.index({ categories: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
