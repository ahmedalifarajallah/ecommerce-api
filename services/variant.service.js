const ProductVariant = require("../models/ProductVariant");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { generateSKU, generateBarcode } = require("../utils/generateSKU");

class VariantService {
  static async createMany({ product, variants, session }) {
    const docs = variants.map((v) => ({
      ...v,
      product: product._id,
      sku: generateSKU({
        title: product.title,
        attributes: v.attributes,
        productId: product._id,
      }),
      barCode: generateBarcode(),
    }));

    return ProductVariant.insertMany(docs, { session, ordered: true });
  }

  static async updateManyVariants({ product, variants, session }) {
    const { _id: productId } = product;

    const bulkOps = variants.map((v) => {
      const { _id: variantId, ...updateFields } = v;

      if (updateFields.attributes) {
        updateFields.sku = generateSKU({
          title: product.title,
          attributes: updateFields.attributes,
          productId,
        });

        updateFields.barCode = generateBarcode();
      }

      return {
        updateOne: {
          filter: { _id: variantId, product: productId },
          update: { $set: updateFields },
        },
      };
    });

    if (!bulkOps.length) return null;

    return ProductVariant.bulkWrite(bulkOps, { session });
  }

  static async deleteMany({ ids, productId, session }) {
    return ProductVariant.deleteMany(
      { _id: { $in: ids }, product: productId },
      { session },
    );
  }
}

module.exports = VariantService;
