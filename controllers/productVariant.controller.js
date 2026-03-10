const Product = require("../models/Product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const validateRequest = require("../utils/validateRequest");
const {
  createProductVariantSchema,
  updateProductVariantSchema,
} = require("../validations/productVariantValidation");
const { uploadImages } = require("../config/multer");
const VariantService = require("../services/variant.service");

exports.uploadVariantImgs = uploadImages.array("images", 5);

/**
 * ============================
 * CREATE (single or multiple)
 * ============================
 */

// variants before =>> [
//   {
//     price: 450,
//     discountPrice: 400,
//     quantity: 10,
//     sku: '',
//     barCode: '',
//     attributes: { size: 'L' },
//     images: [
//       '/public/images/products/variants/product_variant-1770492010641-ec3b086ad276567e.jpeg'
//     ]
//   }
// ]
// variants after =>> [
//   {
//     price: 450,
//     discountPrice: 400,
//     quantity: 10,
//     sku: '',
//     barCode: '',
//     attributes: { size: 'L' },
//     images: [
//       '/public/images/products/variants/product_variant-1770492010641-ec3b086ad276567e.jpeg'
//     ]
//   }
// ]
exports.createVariant = async ({ variantsData, product, session }) => {
  // parse attributes
  const variants = variantsData.map((v) => {
    if (typeof v.attributes === "string") {
      v.attributes = JSON.parse(v.attributes);
    }
    delete v._id;
    return v;
  });

  try {
    variants.forEach((v) => validateRequest(createProductVariantSchema, v));

    const docs = await VariantService.createMany({
      product,
      variants,
      session,
    });

    await product.updateAggregates(session);

    return docs;
  } catch (err) {
    throw err;
  }
};

/**
 * ============================
 * UPDATE (single or multiple)
 * ============================
 */
exports.updateVariant = async ({ variantsData, product, session }) => {
  try {
    // Parse attributes if string
    const variants = variantsData.map((v) => {
      if (v.attributes && typeof v.attributes === "string") {
        v.attributes = JSON.parse(v.attributes);
      }
      return v;
    });

    variants.forEach((v) => validateRequest(updateProductVariantSchema, v));

    const result = await VariantService.updateManyVariants({
      product,
      variants,
      session,
    });

    return result;
  } catch (err) {
    throw err;
  }
};

/**
 * ============================
 * DELETE (single or multiple)
 * ============================
 */
exports.deleteVariant = async ({ productId, variants, session = null }) => {
  try {
    // const variantsIds = variants.map((v) => v._id);

    await VariantService.deleteMany({
      ids: variants,
      productId,
      session,
    });

    const product = await Product.findById(productId).session(session);
    await product.updateAggregates(session);

    return {
      status: "success",
      message: "Variants deleted successfully",
    };
  } catch (error) {
    throw error;
  }
};
