const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },

  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },

  discountValue: {
    type: Number,
    required: true,
  },

  minCartValue: {
    type: Number,
    default: 0,
  },

  maxDiscount: {
    type: Number,
    default: 0,
  },

  startDate: Date,
  endDate: Date,

  usageLimit: Number, // coupon can be used max (N) times total and null mean unlimited usage
  usedCount: { type: Number, default: 0 },

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional if coupon is per user only
  isActive: { type: Boolean, default: true },
});

couponSchema.pre("save", function (next) {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    throw new Error("Percentage cannot exceed 100%");
  }
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
