const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    title: String,
    slug: String,
    mainImage: String,
  },
  variant: {
    name: String,
    sku: String,
    barcode: String,
    price: Number,
    discountPrice: Number,
    stock: Number,
    isAvailable: Boolean,
  },
  quantity: { type: Number, default: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 },
    // tax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
cartSchema.pre("save", function (next) {
  let totalPrice = 0;
  let totalDiscount = 0;

  this.items.forEach((item) => {
    const original = item.variant.price;
    const discounted = item.variant.discountPrice || original;

    totalPrice += discounted * item.quantity;
    totalDiscount += (original - discounted) * item.quantity;
  });

  this.totalPrice = totalPrice;
  this.totalDiscount = totalDiscount;

  next();
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
