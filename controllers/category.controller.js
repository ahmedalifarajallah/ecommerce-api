const Category = require("../models/Category");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { uploadImages } = require("../config/multer");
const path = require("path");
const validateRequest = require("../utils/validateRequest");
const factory = require("./factoryHandler");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validations/categoryValidation");
const ImageService = require("../services/image.service");

exports.uploadCategoryImage = uploadImages.single("image");

exports.getAllCategories = factory.getAll(Category);

exports.getCategory = factory.getOneById(Category);

exports.createCategory = catchAsync(async (req, res, next) => {
  const imageService = new ImageService(
    path.join(__dirname, "../public/images/categories"),
  );
  await imageService.ensureDirectory();

  if (req.body.seo && typeof req.body.seo === "string") {
    req.body.seo = JSON.parse(req.body.seo);
  }

  validateRequest(createCategorySchema, req.body);

  try {
    if (req.file) {
      const categoryImage = await imageService.processImage({
        buffer: req.file.buffer,
        type: "CATEGORY",
      });

      req.body.image = `/public/images/categories/${categoryImage}`;
    }

    // Check if parent category exists
    if (req.body.parentCategory) {
      const exists = await Category.findById(req.body.parentCategory);
      if (!exists) {
        return next(new AppError("No parent category found with that ID", 404));
      }
    }

    const newCategory = await Category.create(req.body);
    imageService.commit();

    res.status(201).json({
      status: "success",
      data: {
        category: newCategory,
      },
    });
  } catch (err) {
    await imageService.rollback();
    throw err;
  }
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const imageService = new ImageService(
    path.join(__dirname, "../public/images/categories"),
  );
  await imageService.ensureDirectory();
  const imagesToDelete = [];

  try {
    if (req.body.seo && typeof req.body.seo === "string") {
      req.body.seo = JSON.parse(req.body.seo);
    }

    const category = await Category.findById(req.params.id);
    if (!category)
      return next(new AppError("No category found with that ID", 404));

    if (req.file) {
      const categoryImage = await imageService.processImage({
        buffer: req.file.buffer,
        type: "CATEGORY",
      });

      req.body.image = `/public/images/categories/${categoryImage}`;
      imagesToDelete.push(category.image);
    }

    validateRequest(updateCategorySchema, req.body);

    // Check if parent category exists
    if (req.body.parentCategory) {
      if (req.body.parentCategory === category._id.toString()) {
        return next(new AppError("Category cannot be its own parent", 400));
      }
      const parentCategory = await Category.findById(req.body.parentCategory);
      if (!parentCategory) {
        return next(new AppError("No parent category found with that ID", 404));
      }
    }

    Object.keys(req.body).forEach((key) => {
      category[key] = req.body[key];
    });
    await category.save();

    if (imagesToDelete.length > 0) {
      await imageService.deleteImages(imagesToDelete);
    }
    imageService.commit();

    res.status(200).json({
      status: "success",
      data: {
        category,
      },
    });
  } catch (err) {
    await imageService.rollback();
    throw err;
  }
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const imageService = new ImageService(
    path.join(__dirname, "../public/images/categories"),
  );
  await imageService.ensureDirectory();

  // Check if category exists
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  // Prevent deletion if it has child categories
  const children = await Category.find({ parentCategory: req.params.id });
  if (children.length > 0) {
    return next(
      new AppError("Cannot delete a category that has subcategories", 400),
    );
  }

  // Delete category
  await Category.findByIdAndDelete(req.params.id);

  if (category.image) {
    await imageService.deleteImages([category.image]);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
