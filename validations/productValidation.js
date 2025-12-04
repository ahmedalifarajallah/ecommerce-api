const Joi = require("joi");
const { seoSchemaValidate } = require("./seoValidation");
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
  main_image: Joi.string().uri().optional(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).max(Joi.ref("price")).optional().messages({
    "number.max": "discountPrice cannot be greater than price",
  }),
  categories: Joi.array().items(objectId).optional().unique(),
  status: Joi.string().valid("active", "inactive").default("active"),
  tags: Joi.array().items(Joi.string()).optional(),
  seo: seoSchemaValidate.optional(),
}).unknown(false);

// ==============================
// UPDATE PRODUCT VALIDATION
// ==============================
exports.updateProductSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().min(5),
  shortDescription: Joi.string().min(5).max(200),
  main_image: Joi.string().uri(),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0).max(Joi.ref("price")).messages({
    "number.max": "discountPrice cannot be greater than price",
  }),
  categories: Joi.array().items(objectId).optional().unique(),
  status: Joi.string().valid("active", "inactive"),
  tags: Joi.array().items(Joi.string()),
  seo: seoSchemaValidate.optional(),
})
  .min(1)
  .unknown(false);

// ==============================
// CREATE PRODUCT VARIANT VALIDATION
// ==============================
exports.createProductVariantSchema = Joi.object({
  product: objectId.required(),
  variantName: Joi.string().trim().optional(),
  color: Joi.string().optional(),
  size: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number()
    .min(0)
    .max(Joi.ref("price"))
    .messages({
      "number.max": "discountPrice cannot be greater than price",
    })
    .optional(),
  quantity: Joi.number().min(0).required(),
  images: Joi.array().items(Joi.string()).min(1).required(),
  weight: Joi.number().min(0).optional(),
  isAvailable: Joi.boolean().optional(),
}).unknown(false);

// ==============================
// UPDATE PRODUCT VARIANT VALIDATION
// ==============================
exports.updateProductVariantSchema = Joi.object({
  variantName: Joi.string().trim().optional(),
  color: Joi.string().optional(),
  size: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  discountPrice: Joi.number()
    .min(0)
    .max(Joi.ref("price"))
    .messages({
      "number.max": "discountPrice cannot be greater than price",
    })
    .optional(),
  quantity: Joi.number().min(0).optional(),
  images: Joi.array().items(Joi.string()).optional(),
  weight: Joi.number().min(0).optional(),
  isAvailable: Joi.boolean().optional(),
}).unknown(false);
