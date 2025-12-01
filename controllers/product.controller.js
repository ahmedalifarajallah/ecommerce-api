const Product = require("../models/Product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/APIFeatures");
const validateRequest = require("../utils/validateRequest");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/productValidation");
const { uploadImages } = require("../config/multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

exports.uploadProductMainImage = uploadImages.single("main_image");

exports.resizeProductMainImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const folderPath = path.join(__dirname, "../public/images/products");

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filename = `product-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(folderPath, filename));

  req.file.filename = filename;

  next();
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new AppError("No product found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.addProduct = catchAsync(async (req, res, next) => {
  validateRequest(createProductSchema, req.body);

  // Pick only allowed fields (whitelist)
  const {
    title,
    description,
    price,
    discountPrice,
    categories,
    status,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;

  if (Number(discountPrice) > Number(price))
    return next(
      new AppError("Discount price cannot be higher than price", 400)
    );

  const product = await Product.create({
    title,
    description,
    price,
    discountPrice,
    categories,
    status,
    metaTitle,
    metaDescription,
    metaKeywords,
    main_image: req.body.main_image,
  });

  res.status(201).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  validateRequest(updateProductSchema, req.body);

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) return next(new AppError("No product found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) return next(new AppError("No product found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});
