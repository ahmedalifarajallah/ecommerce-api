const AppError = require("../utils/AppError");

// ------------ MONGOOSE ERRORS ------------
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = Object.values(err.keyValue)[0];
  return new AppError(
    `Duplicate field: "${field}" with value "${value}". Please use another ${field}.`,
    400
  );
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join(". ");
  return new AppError(`Invalid input data: ${errors}`, 400);
};

// ------------ JWT ERRORS ------------
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleTokenExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

// ------------ FILE ERRORS ------------
const handleFileError = (err) =>
  new AppError(`File upload error: ${err.message}`, 400);

// ------------ GLOBAL ERROR HANDLER ------------
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // -------------------- DEVELOPMENT MODE --------------------
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // -------------------- PRODUCTION MODE --------------------
  let error = { ...err };
  error.message = err.message;

  // Mongoose errors
  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateKeyDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);

  // JWT errors
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleTokenExpiredError();

  // Multer / file errors
  if (err.name === "MulterError") error = handleFileError(err);

  // Operational (expected) errors → show to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  // Programming / unknown errors → hidden message
  console.error("UNEXPECTED ERROR 💥", err);

  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};
