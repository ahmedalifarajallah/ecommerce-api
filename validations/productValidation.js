const Joi = require("joi");
const { seoSchemaValidate } = require("./seoValidation");
const {
  createProductVariantSchema,
  updateProductVariantSchema,
} = require("./productVariantValidation");
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message("Invalid Id");

// ==============================
// CREATE PRODUCT VALIDATION
// ==============================
exports.createProductSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(5).required(),
  shortDescription: Joi.string().min(5).max(200).required(),
  main_image: Joi.string().required(),
  categories: Joi.array().items(objectId).optional().unique(),
  status: Joi.string().valid("active", "inactive").default("active"),
  tags: Joi.array().items(Joi.string()).optional(),
  seo: seoSchemaValidate.optional(),
  variants: Joi.array().items(createProductVariantSchema).min(1).optional(), // embedded variants
}).unknown(false);

// ==============================
// UPDATE PRODUCT VALIDATION
// ==============================
exports.updateProductSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().min(5),
  shortDescription: Joi.string().min(5).max(200),
  main_image: Joi.string().optional(),
  categories: Joi.array().items(objectId).optional().unique(),
  status: Joi.string().valid("active", "inactive"),
  tags: Joi.array().items(Joi.string()),
  seo: seoSchemaValidate.optional(),
  variants: Joi.array().items(updateProductVariantSchema).optional(), // embedded variants,  allow updates
  slug: Joi.string().optional(),
})
  .min(1)
  .unknown(false);
