const factory = require("./factoryHandler");
const Product = require("../models/Product");
const catchAsync = require("../utils/catchAsync");
const { uploadImages } = require("../config/multer");
const validateRequest = require("../utils/validateRequest");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/productValidation");
const ImageService = require("../services/image.service");
const path = require("path");
const AppError = require("../utils/AppError");
const {
  createVariant,
  deleteVariant,
  updateVariant,
} = require("./productVariant.controller");
const { withTransaction } = require("../utils/withTransaction");
const ProductVariant = require("../models/ProductVariant");

exports.uploadProductImgs = uploadImages.any();

exports.getAllProducts = factory.getAll(Product);

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.addProduct = catchAsync(async (req, res, next) => {
  const productImageService = new ImageService(
    path.join(__dirname, "../public/images/products/main"),
  );
  await productImageService.ensureDirectory();
  const variantsImageService = new ImageService(
    path.join(__dirname, "../public/images/products/variants"),
  );
  await variantsImageService.ensureDirectory();

  try {
    // ---------- Parse JSON fields ----------
    if (req.body.seo && typeof req.body.seo === "string") {
      req.body.seo = JSON.parse(req.body.seo);
    }

    // ---------- Main Image ----------
    const mainImageFile = req.files?.find(
      (file) => file.fieldname === "main_image",
    );
    if (!mainImageFile) {
      throw new AppError("Main image is required", 400);
    }

    const mainImageName = await productImageService.processImage({
      buffer: mainImageFile.buffer,
      type: "PRODUCT_MAIN",
    });

    req.body.main_image = `/public/images/products/main/${mainImageName}`;

    if (req.body.variants?.length) {
      // Parse JSON fields
      if (typeof req.body.variants === "string")
        req.body.variants = JSON.parse(req.body.variants);

      // process variants images
      for (let i = 0; i < req.body.variants.length; i++) {
        // find files for this variant by fieldname
        const variantFiles = req.files.filter((file) =>
          file.fieldname.startsWith(`variant_images_${i}_`),
        );

        if (variantFiles.length) {
          const variantsImages = await Promise.all(
            variantFiles.map(async (file) => {
              const filename = await variantsImageService.processImage({
                buffer: file.buffer,
                type: "PRODUCT_VARIANT",
              });
              return `/public/images/products/variants/${filename}`;
            }),
          );
          req.body.variants[i].images = variantsImages;
        }
      }
    }

    validateRequest(createProductSchema, req.body);
    // ---------- Product Validate ----------

    // ---------- Create Product and Variants ----------
    const result = await withTransaction(async (session) => {
      const product = await Product.create([req.body], { session });

      if (req.body.variants?.length) {
        // Create variants
        await createVariant({
          variantsData: req.body.variants,
          product: product[0],
          session,
        });
      }

      variantsImageService.commit();

      return { product: product[0] };
    });

    productImageService.commit();

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    // rollback images
    await variantsImageService.rollback();
    await productImageService.rollback();
    next(err);
  }
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const productImageService = new ImageService(
    path.join(__dirname, "../public/images/products/main"),
  );
  const variantsImageService = new ImageService(
    path.join(__dirname, "../public/images/products/variants"),
  );
  await productImageService.ensureDirectory();
  await variantsImageService.ensureDirectory();

  const imagesToDelete = {
    main_image: [],
    variant_images: [],
  };

  try {
    // Parse SEO fields if coming as string
    if (req.body.seo && typeof req.body.seo === "string") {
      req.body.seo = JSON.parse(req.body.seo);
    }
    // Parse variant fields if coming as string
    if (req.body.variants && typeof req.body.variants === "string") {
      req.body.variants = JSON.parse(req.body.variants);
    }

    // Get the existing product
    const product = await Product.findById(req.params.id);
    if (!product)
      return next(new AppError("No product found with that ID", 404));

    // Handle main image upload
    const mainImageFile = req.files?.find(
      (file) => file.fieldname === "main_image",
    );
    if (mainImageFile) {
      const filename = await productImageService.processImage({
        buffer: mainImageFile.buffer,
        type: "PRODUCT_MAIN",
      });

      // Mark old main image for deletion
      if (product.main_image)
        imagesToDelete.main_image.push(product.main_image);

      req.body.main_image = `/public/images/products/main/${filename}`;
    }

    // ================= VARIANTS PROCESS =================
    let deletedVariantIds = [];
    let newVariants = [];
    let existingVariants = [];

    if (req.body.variants?.length) {
      // Get existing variants
      const dbVariants = await ProductVariant.find({
        product: product._id,
      });

      // Convert existing variants to map
      const dbVariantMap = new Map(
        dbVariants.map((v) => [v._id.toString(), v]),
      );

      // Get incoming variant ids
      const incomingIds = req.body.variants
        .filter((v) => v._id)
        .map((v) => v._id.toString());

      // Get deleted variant ids
      deletedVariantIds = dbVariants
        .filter((v) => !incomingIds.includes(v._id.toString()))
        .map((v) => v._id);

      // Get new variants
      newVariants = req.body.variants.filter((v) => !v._id);

      // Get existing variants
      existingVariants = req.body.variants.filter((v) => v._id);

      // ======== HANDLE VARIANT IMAGES ========
      for (let i = 0; i < req.body.variants.length; i++) {
        const variant = req.body.variants[i];

        const variantFiles = req.files?.filter((file) =>
          file.fieldname.startsWith(`variants[${i}][images]`),
        );

        let uploadedImages = [];

        if (variantFiles?.length) {
          uploadedImages = await Promise.all(
            variantFiles.map(async (file) => {
              const filename = await variantsImageService.processImage({
                buffer: file.buffer,
                type: "PRODUCT_VARIANT",
              });

              return `/public/images/products/variants/${filename}`;
            }),
          );
        }

        const keepImages = [...(variant.images || []), ...uploadedImages];

        const mergedImages = [...new Set(keepImages)];

        if (variant._id) {
          const dbVariant = dbVariantMap.get(variant._id.toString());

          const removedImages = (dbVariant?.images || []).filter(
            (img) => !mergedImages.includes(img),
          );

          imagesToDelete.variant_images.push(...removedImages);
        }

        variant.images = mergedImages;
      }

      // ===== delete images of deleted variants =====
      deletedVariantIds.forEach((id) => {
        const v = dbVariantMap.get(id.toString());
        if (v?.images?.length) imagesToDelete.variant_images.push(...v.images);
      });
    }

    // Validate updated product
    validateRequest(updateProductSchema, req.body);

    // ================= TRANSACTION =================
    const result = await withTransaction(async (session) => {
      const productToUpdate = await Product.findById(product._id).session(
        session,
      );
      if (!productToUpdate) {
        throw new AppError("No product found with that ID", 404);
      }

      // Update product fields
      Object.keys(req.body).forEach((key) => {
        productToUpdate[key] = req.body[key];
      });

      // DELETE VARIANTS
      if (deletedVariantIds.length) {
        console.log(deletedVariantIds);
        await deleteVariant({
          productId: productToUpdate._id,
          variants: deletedVariantIds,
          session,
        });
      }

      // UPDATE VARIANTS
      if (existingVariants.length) {
        await updateVariant({
          variantsData: existingVariants,
          product: productToUpdate,
          session,
        });
      }

      // CREATE VARIANTS
      if (newVariants.length) {
        await createVariant({
          product: productToUpdate,
          variantsData: newVariants,
          session,
        });
      }

      // Save product
      await productToUpdate.save({ session });
      await productToUpdate.updateAggregates(session);

      return productToUpdate.toObject();
    });

    variantsImageService.commit();
    productImageService.commit();

    // Delete old main image and old variant images from server
    if (imagesToDelete) {
      await productImageService.deleteImages(imagesToDelete?.main_image || []);
      await variantsImageService.deleteImages(
        imagesToDelete?.variant_images || [],
      );
    }

    res.status(200).json({
      status: "success",
      data: { ...result },
    });
  } catch (err) {
    await productImageService.rollback();
    await variantsImageService.rollback();
    throw err;
  }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const productImageService = new ImageService(
    path.join(__dirname, "../public/images/products/main"),
  );
  await productImageService.ensureDirectory();

  const imageVariantService = new ImageService(
    path.join(__dirname, "../public/images/products/variants"),
  );
  await imageVariantService.ensureDirectory();

  try {
    let productData = null;
    let imagesToDelete = [];

    await withTransaction(async (session) => {
      // Find product with variants
      const product = await Product.findById(id).session(session);
      if (!product) {
        throw new AppError("No product found with that ID", 404);
      }

      // Get all variants for this product
      const variants = await ProductVariant.find({ product: id }).session(
        session,
      );

      if (variants.length > 0) {
        // Delete variants
        await deleteVariant({
          productId: product._id,
          variants,
          session,
        });

        const variantsImages = variants.flatMap((v) => v.images);
        imagesToDelete.push(...variantsImages);
      }

      await Product.findByIdAndDelete(id, { session });

      productData = product;
    });

    // Delete images from server
    if (productData.main_image) {
      await productImageService.deleteImages([productData.main_image]);
    }
    if (imagesToDelete.length > 0) {
      await imageVariantService.deleteImages([...new Set(imagesToDelete)]);
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
});
