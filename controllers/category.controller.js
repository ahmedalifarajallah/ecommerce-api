const Category = require("../models/Category");
const APIFeatures = require("../utils/APIFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { uploadImages } = require("../config/multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

exports.uploadCategoryImage = uploadImages.single("image");

exports.resizeCategoryImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const folderPath = path.join(__dirname, "../public/images/categories");

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filename = `category-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(folderPath, filename));

  req.file.filename = filename;

  next();
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const features = await new APIFeatures(Category.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const categories = await features.query;

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category)
    return next(new AppError("No category found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      category: newCategory,
    },
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category)
    return next(new AppError("No category found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category)
    return next(new AppError("No category found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});
