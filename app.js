const express = require("express");
const path = require("path");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middleware/errorHandler");
const helmet = require("helmet");
const cors = require("cors");
const rateLimiter = require("./middleware/rateLimiter");
const morgan = require("morgan");
const compression = require("compression");
const config = require("./config/config");
const logger = require("./utils/logger");

// Routes
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

const app = express();

// Logging
if (config.env === "development") {
  app.use(morgan("dev", { stream: logger.stream }));
} else {
  app.use(morgan("combined", { stream: logger.stream }));
}

// Middlewares
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);
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

module.exports = app;
