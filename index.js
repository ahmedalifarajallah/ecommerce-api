const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middleware/errorHandler");
const helmet = require("helmet");
const cors = require("cors");
const rateLimiter = require("./middleware/rateLimiter");
const morgan = require("morgan");
const compression = require("compression");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const categoryRoutes = require("./routes/category.routes");
const couponRoutes = require("./routes/coupon.routes");
const orderRoutes = require("./routes/order.routes");
const productRoutes = require("./routes/product.routes");
const productVariantRoutes = require("./routes/productVariant.routes");
const reviewRoutes = require("./routes/review.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const usersRoutes = require("./routes/user.routes");

dotenv.config();

// uncaughtException
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

connectDB();

const app = express();

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middlewares
app.use(cors());
app.use(helmet());
app.use("/api", rateLimiter);
app.use(express.json({ limit: "20kb" }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(compression());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/product-variant", productVariantRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/wishlists", wishlistRoutes);
app.use("/api/v1/users", usersRoutes);

// Handle non-existing routes
app.all(/.*/, (req, res, next) =>
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404)),
);

// Global error handler
app.use(globalErrorHandler);

// Server
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port http://localhost:${process.env.PORT}`);
});

// unhandled Promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});
