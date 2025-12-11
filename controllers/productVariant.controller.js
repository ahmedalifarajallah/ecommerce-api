const ProductVariant = require("../models/ProductVariant");
const Product = require("../models/Product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const validateRequest = require("../utils/validateRequest");
const {
  createProductVariantSchema,
  updateProductVariantSchema,
} = require("../validations/productVariantValidation");
const { generateSKU } = require("../utils/skuGenerator");
const { uploadImages } = require("../config/multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

exports.uploadVariantImgs = uploadImages.fields([
  { name: "images", maxCount: 5 },
]);

exports.resizeVariantImgs = catchAsync(async (req, res, next) => {
  if (!req.files.images) return next();

  const folderPath = path.join(__dirname, "../public/images/products");

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `product-variant-${req.params.productId}-${Date.now()}-${
        i + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/products/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  next();
});

exports.createVariant = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;

  validateRequest(createProductVariantSchema, req.body);

  const product = await Product.findById(productId);
  if (!product) return next(new AppError("No product found with that ID", 404));

  if (Number(req.body.discountPrice) > Number(req.body.price))
    return next(
      new AppError("Discount price cannot be higher than price", 400)
    );

  const variant = await ProductVariant.create({
    ...req.body,
    product: productId,
    sku: generateSKU({
      title: product.title,
      color: req.body.color,
      size: req.body.size,
      productId: product._id.toString(),
    }),
    barCode: Math.floor(Math.random() * 1e12)
      .toString()
      .padStart(12, "0"),
    isAvailable: Number(req.body.quantity) > 0,
  });

  res.status(201).json({
    status: "success",
    data: {
      variant,
    },
  });
});

exports.updateVariant = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  const variantId = req.params.id;

  validateRequest(updateProductVariantSchema, req.body);

  const product = await Product.findById(productId);
  if (!product) return next(new AppError("No product found with that ID", 404));

  if (Number(req.body.discountPrice) > Number(req.body.price))
    return next(
      new AppError("Discount price cannot be higher than price", 400)
    );

  const variant = await ProductVariant.findOneAndUpdate(
    { _id: variantId, product: productId },
    { ...req.body, isAvailable: Number(req.body.quantity) > 0 },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!variant) return next(new AppError("No variant found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      variant,
    },
  });
});

exports.deleteVariant = catchAsync(async (req, res, next) => {
  const variant = await ProductVariant.findOneAndDelete({
    _id: req.params.id,
    product: req.params.productId,
  });

  if (!variant) return next(new AppError("No variant found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});
