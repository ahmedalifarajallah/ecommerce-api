const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const validateRequest = require("../utils/validateRequest");
const jwt = require("jsonwebtoken");
const { signupSchema, loginSchema } = require("../validations/userValidation");
const Email = require("../utils/email");
const bcrypt = require("bcryptjs");

// Generate JWT
const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, message, res) => {
  const token = signToken(user);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  // Validate request body
  validateRequest(signupSchema, req.body);

  const { name, email, username, password, passwordConfirm, photo, role } =
    req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password,
    passwordConfirm,
    photo,
    role: role || "user",
  });

  // Send Welcome Email
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(user, url).sendWelcome();

  createSendToken(user, 201, "User created successfully", res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate request body
  validateRequest(loginSchema, req.body);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, "Logged in successfully", res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ status: "success", message: "Logged out." });
};
