const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant", // optional if product has variants
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
    },
    images: [String],
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same user
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Auto-populate review user
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
});

// Recalculate Product Rating automatically
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  await mongoose.model("Product").findByIdAndUpdate(productId, {
    ratingsAverage: stats.length ? stats[0].avgRating : 0,
    ratingsCount: stats.length ? stats[0].numReviews : 0,
  });
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.post("findOneAndUpdate", function (doc) {
  if (doc) doc.constructor.calcAverageRatings(doc.product);
});

reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) doc.constructor.calcAverageRatings(doc.product);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
