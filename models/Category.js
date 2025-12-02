const { required } = require("joi");
const mongoose = require("mongoose");
const slugify = require("slugify");

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
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
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
