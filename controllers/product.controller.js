const Product = require("../models/Product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/APIFeatures");
const validateRequest = require("../utils/validateRequest");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/productValidation");
const slugify = require("slugify");
const { uploadImages } = require("../config/multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { generateSKU, generateBarcode } = require("../utils/skuGenerator");

exports.uploadProductMainImg = uploadImages.single("main_image");

exports.resizeProductMainImg = catchAsync(async (req, res, next) => {
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

  req.body.main_image = filename;

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

// TODO: Handle Images Upload
exports.addProduct = catchAsync(async (req, res, next) => {
  // Convert variants string to array
  if (req.body.variants && typeof req.body.variants === "string") {
    req.body.variants = JSON.parse(req.body.variants);
  }

  // Convert seo string to object
  if (req.body.seo && typeof req.body.seo === "string")
    req.body.seo = JSON.parse(req.body.seo);

  // validate request
  validateRequest(createProductSchema, req.body);

  // check if there are variants and create SKU and BarCode for each variant
  if (req.body.variants && req.body.variants.length > 0) {
    req.body.variants.forEach((variant) => {
      variant.sku = generateSKU({
        title: req.body.title,
        attributes: variant.attributes,
        index: req.body.variants.indexOf(variant),
      });
      variant.barCode = generateBarcode();
    });
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  if (req.body.seo && typeof req.body.seo === "string")
    req.body.seo = JSON.parse(req.body.seo);

  validateRequest(updateProductSchema, req.body);

  if (req.body.title) req.body.slug = slugify(req.body.title, { lower: true }); // Ensure slugify is available

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

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
