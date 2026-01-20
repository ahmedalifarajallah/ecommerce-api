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

exports.uploadProductImgs = uploadImages.any();

// Utility function to delete image files
const deleteImageFiles = (imagePaths) => {
  const folderPath = path.join(__dirname, "../public/images/products");

  if (Array.isArray(imagePaths)) {
    imagePaths.forEach((imagePath) => {
      if (imagePath) {
        const fullPath = path.join(folderPath, imagePath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (err) {
            console.error(`Error deleting image ${fullPath}:`, err.message);
          }
        }
      }
    });
  } else if (imagePaths) {
    const fullPath = path.join(folderPath, imagePaths);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`Error deleting image ${fullPath}:`, err.message);
      }
    }
  }
};
// Utility function to get all images from a product (main + all variant images)
const getAllProductImages = (product) => {
  const images = [];

  if (product.main_image) {
    images.push(product.main_image);
  }

  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((variant) => {
      if (variant.images && Array.isArray(variant.images)) {
        images.push(...variant.images);
      }
    });
  }

  return images;
};

exports.resizeProductImgs = catchAsync(async (req, res, next) => {
  // Initialize tracking arrays
  req.uploadedImages = [];
  req.imagesToDelete = [];

  if (!req.files) {
    return next();
  }

  try {
    // Parse variants once if needed
    if (req.body.variants && typeof req.body.variants === "string") {
      req.body.variants = JSON.parse(req.body.variants);
    }

    const folderPath = path.join(__dirname, "../public/images/products");
    if (!fs.existsSync(folderPath))
      fs.mkdirSync(folderPath, { recursive: true });

    const timestamp = Date.now();
    const variantImagesMap = {};

    for (const file of req.files) {
      // MAIN IMAGE
      if (file.fieldname === "main_image") {
        const mainImageName = `product-${timestamp}-main.jpeg`;
        const mainImagePath = path.join(folderPath, mainImageName);

        await sharp(file.buffer)
          .resize(500, 500)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(mainImagePath);

        req.body.main_image = mainImageName;
        req.uploadedImages.push(mainImageName);
        continue;
      }

      // VARIANT IMAGES
      const match = file.fieldname.match(/variant_images\[(\d+)\]/);

      if (match) {
        const variantIndex = Number(match[1]);
        if (!variantImagesMap[variantIndex])
          variantImagesMap[variantIndex] = [];

        const filename = `product-${timestamp}-${variantIndex}-${variantImagesMap[variantIndex].length}.jpeg`;
        const variantImagePath = path.join(folderPath, filename);

        await sharp(file.buffer)
          .resize(600, 350)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(variantImagePath);

        variantImagesMap[variantIndex].push(filename);
        req.uploadedImages.push(filename);
      }
    }

    // Attach images to variants and ensure each variant has at least one image
    if (req.body.variants && Array.isArray(req.body.variants)) {
      req.body.variants.forEach((variant, index) => {
        const newUploadedImages = variantImagesMap[index];

        // If new images were uploaded for this variant
        if (newUploadedImages && newUploadedImages.length > 0) {
          // If variant already has images (existing images client wants to keep), merge with new uploads
          if (variant.images && Array.isArray(variant.images)) {
            variant.images = [...variant.images, ...newUploadedImages];
          } else {
            variant.images = newUploadedImages;
          }
        }

        // For create operation, ensure variant has at least one image
        if (
          !req.params.id &&
          (!variant.images || variant.images.length === 0)
        ) {
          throw new AppError(
            `Variant ${index + 1} must have at least one image`,
            400,
          );
        }
      });
    }

    next();
  } catch (error) {
    // Clean up any images that were uploaded before the error
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      deleteImageFiles(req.uploadedImages);
    }
    throw error; // Re-throw to be caught by catchAsync
  }
});

exports.addProduct = catchAsync(async (req, res, next) => {
  try {
    // Convert SEO
    if (req.body.seo && typeof req.body.seo === "string") {
      req.body.seo = JSON.parse(req.body.seo);
    }

    // Validate request
    validateRequest(createProductSchema, req.body);

    // Generate SKU and Barcode for each variant
    if (req.body.variants && Array.isArray(req.body.variants)) {
      req.body.variants.forEach((variant, index) => {
        variant.sku = generateSKU({
          title: req.body.title,
          attributes: variant.attributes,
          index,
        });
        variant.barCode = generateBarcode();
      });
    }

    // Create product in DB
    const product = await Product.create(req.body);

    // Clear uploaded images tracking on success
    req.uploadedImages = [];

    res.status(201).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    // Rollback: Delete uploaded images if product creation fails
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      deleteImageFiles(req.uploadedImages);
    }
    throw error; // Re-throw to be caught by catchAsync
  }
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

exports.updateProduct = catchAsync(async (req, res, next) => {
  // Get existing product first to handle image management
  const existingProduct = await Product.findById(req.params.id);

  if (!existingProduct) {
    // Clean up any uploaded images if product doesn't exist
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      deleteImageFiles(req.uploadedImages);
    }
    return next(new AppError("No product found with that ID", 404));
  }

  try {
    if (req.body.seo && typeof req.body.seo === "string")
      req.body.seo = JSON.parse(req.body.seo);

    // Parse variants if provided as string
    if (req.body.variants && typeof req.body.variants === "string") {
      req.body.variants = JSON.parse(req.body.variants);
    }

    validateRequest(updateProductSchema, req.body);

    if (req.body.title)
      req.body.slug = slugify(req.body.title, { lower: true });

    // Handle main image replacement
    if (req.body.main_image) {
      // If a new main image was uploaded, mark old one for deletion
      if (
        existingProduct.main_image &&
        existingProduct.main_image !== req.body.main_image
      ) {
        req.imagesToDelete.push(existingProduct.main_image);
      }
    }

    // Handle variant images
    if (req.body.variants && Array.isArray(req.body.variants)) {
      const existingVariants = existingProduct.variants || [];

      // Delete images from variants that were removed (exist in DB but not in update)
      existingVariants.forEach((existingVariant, existingIndex) => {
        // Check if this variant still exists (by comparing index or other identifier)
        // If the update has fewer variants, delete images from removed variants
        if (existingIndex >= req.body.variants.length) {
          if (existingVariant.images && Array.isArray(existingVariant.images)) {
            existingVariant.images.forEach((img) => {
              req.imagesToDelete.push(img);
            });
          }
        }
      });

      req.body.variants.forEach((variant, index) => {
        const existingVariant = existingVariants[index];

        if (existingVariant && existingVariant.images) {
          // If variant has new images uploaded, merge or replace
          if (variant.images && Array.isArray(variant.images)) {
            // Check which existing images are being removed
            const existingImages = existingVariant.images || [];
            const newImages = variant.images;

            // Find images that exist in DB but not in new request (marked for deletion)
            existingImages.forEach((existingImg) => {
              // If the existing image is not in the new images array and not in uploaded images
              // it means it's being removed
              if (
                !newImages.includes(existingImg) &&
                !req.uploadedImages.includes(existingImg)
              ) {
                req.imagesToDelete.push(existingImg);
              }
            });

            // Merge: keep existing images that are still in the new array, add new uploaded ones
            const imagesToKeep = existingImages.filter((img) =>
              newImages.includes(img),
            );
            const newUploadedImages = newImages.filter((img) =>
              req.uploadedImages.includes(img),
            );
            variant.images = [...imagesToKeep, ...newUploadedImages];
          } else {
            // If no images provided in variant, keep existing images
            variant.images = existingVariant.images;
          }
        }
      });
    } else {
      // If variants not provided in update, keep existing variants
      req.body.variants = existingProduct.variants;
    }

    // Update product in DB
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      // Clean up uploaded images if update fails
      if (req.uploadedImages && req.uploadedImages.length > 0) {
        deleteImageFiles(req.uploadedImages);
      }
      return next(new AppError("No product found with that ID", 404));
    }

    // Delete old images that were replaced (only after successful update)
    if (req.imagesToDelete && req.imagesToDelete.length > 0) {
      deleteImageFiles(req.imagesToDelete);
    }

    // Clear uploaded images tracking on success
    req.uploadedImages = [];

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (error) {
    // Rollback: Delete uploaded images if update fails
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      deleteImageFiles(req.uploadedImages);
    }
    throw error; // Re-throw to be caught by catchAsync
  }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  // Get product first to access images before deletion
  const product = await Product.findById(req.params.id);

  if (!product) return next(new AppError("No product found with that ID", 404));

  // Delete all product images
  const allImages = getAllProductImages(product);
  if (allImages.length > 0) {
    deleteImageFiles(allImages);
  }

  // Delete product from DB
  await Product.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
