const path = require("path");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const slugify = require("slugify");
const ImageService = require("./image.service");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/productValidation");
const validateRequest = require("../utils/validateRequest");
const { generateSKU, generateBarcode } = require("../utils/generateSKU");
const mongoose = require("mongoose");

class ProductService {
  async createProduct(data, files) {
    const imageService = new ImageService(
      path.join(__dirname, "../public/images/products"),
    );

    try {
      await imageService.ensureDirectory();

      const uploadedImages = {}; // variantIndex => [new images]

      // ---------- Process Files ----------
      for (const file of files || []) {
        if (file.fieldname === "main_image") {
          data.main_image = await imageService.processMainImage(file.buffer);
          continue;
        }

        const match = file.fieldname.match(/variant_images\[(\d+)\]/);
        if (match) {
          const index = Number(match[1]);
          if (!uploadedImages[index]) uploadedImages[index] = [];
          const filename = await imageService.processVariantImage(file.buffer);
          uploadedImages[index].push(filename);
        }
      }

      // ---------- Merge Variants ----------
      if (data.variants && Array.isArray(data.variants)) {
        data.variants = data.variants.map((variant, index) => {
          return {
            ...variant,
            images: [
              ...(variant.images || []),
              ...(uploadedImages[index] || []),
            ],
          };
        });
      }

      // ---------- Validate ----------
      validateRequest(createProductSchema, data);

      // ---------- Generate SKU/Barcode ----------
      if (data.variants && Array.isArray(data.variants)) {
        data.variants.forEach((variant, index) => {
          variant.sku = generateSKU({
            title: data.title,
            attributes: variant.attributes,
            index,
          });
          variant.barCode = generateBarcode();
        });
      }

      // ---------- Create Product ----------
      const product = await Product.create(data);
      return product;
    } catch (err) {
      await imageService.rollback();
      throw err;
    }
  }

  async updateProduct(id, data, files) {
    const imageService = new ImageService(
      path.join(__dirname, "../public/images/products"),
    );

    const existingProduct = await Product.findById(id);
    if (!existingProduct) throw new AppError("Product not found", 404);

    await imageService.ensureDirectory();

    const imagesToDelete = [];
    const uploadedImages = {}; // variantId => [new images]

    try {
      // ---------- Slug ----------
      if (data.title) {
        data.slug = slugify(data.title, { lower: true, strict: true });
      }

      // ---------- Process Files ----------
      for (const file of files || []) {
        if (file.fieldname === "main_image") {
          const filename = await imageService.processMainImage(file.buffer);
          data.main_image = filename;

          if (existingProduct.main_image) {
            imagesToDelete.push(existingProduct.main_image);
          }
          continue;
        }

        const match = file.fieldname.match(/variant_images\[(.+?)\]/);
        if (match) {
          const variantId = match[1];
          if (!uploadedImages[variantId]) uploadedImages[variantId] = [];

          const filename = await imageService.processVariantImage(file.buffer);
          uploadedImages[variantId].push(filename);
        }
      }

      // ---------- Merge Variants ----------
      if (data.variants) {
        for (let index = 0; index < data.variants.length; index++) {
          const variant = data.variants[index];
          let existVariant = existingProduct.variants.id(variant._id);

          if (existVariant) {
            // تحديث الـ variant الموجود
            existVariant.attributes = variant.attributes;
            existVariant.price = variant.price;
            existVariant.discountPrice = variant.discountPrice;
            existVariant.quantity = variant.quantity;
            existVariant.isAvailable = variant.quantity > 0;
            existVariant.sku = generateSKU({
              title: data.title,
              attributes: variant.attributes,
              index,
            });
            existVariant.barCode = existVariant.barCode || generateBarcode();

            const newImgs = uploadedImages[variant._id];
            if (newImgs && newImgs.length > 0) {
              imagesToDelete.push(...existVariant.images);
              existVariant.images = newImgs;
            }
          } else {
            // ➕ إضافة variant جديد
            const newVariant = {
              _id: new mongoose.Types.ObjectId(),
              attributes: variant.attributes,
              price: variant.price,
              discountPrice: variant.discountPrice,
              quantity: variant.quantity,
              isAvailable: variant.quantity > 0,
              sku: generateSKU({
                title: data.title,
                attributes: variant.attributes,
                index,
              }),
              barCode: generateBarcode(),
              images: uploadedImages[variant._id] || [], // الصور الجديدة هنا
            };
            existingProduct.variants.push(newVariant);
          }
        }
      }

      // ---------- Validate ----------
      validateRequest(updateProductSchema, data);

      // ---------- Update DB ----------
      await existingProduct.save();

      // ---------- Delete Removed Images ----------
      if (imagesToDelete.length) {
        await imageService.deleteImages([...new Set(imagesToDelete)]);
      }
      return existingProduct;
    } catch (err) {
      await imageService.rollback();
      throw err;
    }
  }

  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    // Collect all images
    const allImages = [];
    if (product.main_image) allImages.push(product.main_image);
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.images) allImages.push(...v.images);
      });
    }

    await Product.findByIdAndDelete(id);

    if (allImages.length > 0) {
      await imageService.deleteImages(allImages);
    }
  }
}

module.exports = new ProductService();
