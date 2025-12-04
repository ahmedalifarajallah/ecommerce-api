const { required } = require("joi");
const mongoose = require("mongoose");
const slugify = require("slugify");
const { seoSchema } = require("./Seo");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    slug: { type: String, unique: true },
    seo: seoSchema,
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

categorySchema.pre(/^find/, function (next) {
  this.populate({
    path: "parentCategory",
    select: "-createdAt -updatedAt -__v",
  });
  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
