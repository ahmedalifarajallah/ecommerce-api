const fs = require("fs");
const path = require("path");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const validateRequest = require("../utils/validateRequest");
const factory = require("./factoryHandler");
const {
  updateMeSchema,
  adminUpdateUserSchema,
} = require("../validations/userValidation");
const sharp = require("sharp");
const { uploadImages } = require("../config/multer");
const APIFeatures = require("../utils/APIFeatures");

const ImageService = require("../services/image.service");
const { CONSTANTS } = require("../utils/constants");

exports.uploadUserPhoto = uploadImages.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const folderPath = path.join(__dirname, "../public/images/users");
  const imageService = new ImageService(folderPath);

  await imageService.ensureDirectory();

  const filename = await imageService.processImage(
    req.file.buffer,
    CONSTANTS.IMAGE_RESIZE.USER,
    `user-${req.params.id || req.user.id}`,
  );

  req.file.filename = filename;

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    User.find({ _id: { $ne: req.user.id } }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.getUser = factory.getOneById(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  validateRequest(updateMeSchema, req.body);

  if (req.body.email) {
    return next(new AppError("You cannot update your email", 400));
  }

  const filteredBody = filterObj(req.body, "name", "username");

  if (req.file) filteredBody.photo = req.file.filename;

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.updateUserByAdmin = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  validateRequest(adminUpdateUserSchema, req.body);

  // Allow admin to update name, email, username, role, active
  const filteredBody = filterObj(
    req.body,
    "name",
    "email",
    "username",
    "role",
    "active",
  );

  if (req.body.email) {
    return next(new AppError("You cannot update user's email", 400));
  }

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

exports.resetUserPasswordByAdmin = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  // Validate password presence
  if (!password || !passwordConfirm) {
    return next(new AppError("Password and passwordConfirm are required", 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match", 400));
  }

  // Find user
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("No user found with that ID", 404));

  // Update password directly
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save(); // use save() to run mongoose pre-save hooks

  res.status(200).json({
    status: "success",
    message: `Password for ${user.email} has been reset successfully`,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    message: "User deleted successfully",
    data: null,
  });
});

exports.deleteUserByAdmin = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // Soft delete
  user.active = false;
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: "success",
    message: "User deactivated",
    data: null,
  });
});
