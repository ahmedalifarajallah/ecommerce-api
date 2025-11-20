const { default: mongoose } = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      id: mongoose.Schema.Types.ObjectId,
      title: String,
      slug: String,
      mainImage: String,
    },
    variant: {
      id: mongoose.Schema.Types.ObjectId,
      name: String,
      sku: String,
      barcode: String,
      price: Number,
      discountPrice: Number,
    },
    quantity: Number,
    totalItemPrice: Number,
  },
  {
    timestamps: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    items: [orderItemSchema],
    totalPrice: Number,
    totalDiscount: Number,
    finalPrice: Number, // after shipping, coupon, etc.

    shippingAddress: {
      name: String,
      phone: String,
      city: String,
      address: String,
    },

    paymentMethod: { type: String, enum: ["cod", "card"], default: "cod" },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
