const Joi = require("joi");
const { seoSchemaValidate } = require("./seoValidation");
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message("Invalid Id");

// ==============================
// VARIANT VALIDATION
// ==============================
const variantSchemaValidate = Joi.object({
  attributes: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .min(1)
    .required()
    .messages({
      "object.min": "At least one attribute (like size or color) is required",
    }),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number()
    .min(0)
    .max(Joi.ref("price"))
    .messages({ "number.max": "Discount price cannot be greater than price" })
    .optional(),
  quantity: Joi.number().min(0).required(),
  images: Joi.array().items(Joi.string()).min(1).required(),
  isAvailable: Joi.boolean().optional(),
  sku: Joi.string().trim().allow(null, ""),
  barCode: Joi.string().trim().allow(null, ""),
});

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
  variants: Joi.array().items(variantSchemaValidate).min(1).optional(), // embedded variants
}).unknown(false);

// ==============================
// UPDATE PRODUCT VALIDATION
// ==============================
exports.updateProductSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().min(5),
  shortDescription: Joi.string().min(5).max(200),
  main_image: Joi.string().optional(),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0).max(Joi.ref("price")).messages({
    "number.max": "discountPrice cannot be greater than price",
  }),
  categories: Joi.array().items(objectId).optional().unique(),
  status: Joi.string().valid("active", "inactive"),
  tags: Joi.array().items(Joi.string()),
  seo: seoSchemaValidate.optional(),
  variants: Joi.array().items(variantSchemaValidate).min(1).optional(), // embedded variants,  allow updates
})
  .min(1)
  .unknown(false);
