const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const validateRequest = require("../utils/validateRequest");
const jwt = require("jsonwebtoken");
const {
  signupSchema,
  loginSchema,
  updatePasswordSchema,
} = require("../validations/userValidation");
const Email = require("../utils/email");
const crypto = require("crypto");

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
    expires: new Date(Date.now() - 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ status: "success", message: "Logged out." });
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // validate request body
  validateRequest(updatePasswordSchema, req.body);

  // Get user and include password
  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new AppError("User Not Found", 404));

  // Check current password
  const correctPassword = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );

  if (!correctPassword) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Send new token
  createSendToken(user, 200, "Password Updated Successfully!", res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There is no user with email address", 404));

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send reset token to user's email
  const url = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/reset-password/${resetToken}`;

  try {
    await new Email(user, url).sendResetToken();
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // hash the reset-token to compare
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Get user based on the token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  // Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send new token
  createSendToken(user, 200, "Password Updated Successfully!", res);
});
