const Joi = require("joi");
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// ==============================
// CREATE PRODUCT VALIDATION
// ==============================
exports.createProductSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),

  description: Joi.string().min(5).required(),

  main_image: Joi.string().uri().optional(),

  price: Joi.number().min(0).required(),

  discountPrice: Joi.number().min(0).max(Joi.ref("price")).optional().messages({
    "number.max": "discountPrice cannot be greater than price",
  }),

  categories: Joi.array().items(objectId).optional(),

  status: Joi.string().valid("active", "inactive").default("active"),

  metaTitle: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
  // metaKeywords: Joi.array().items(Joi.string()).optional(),
  metaKeywords: Joi.string().optional(),
});

// ==============================
// UPDATE PRODUCT VALIDATION
// ==============================

exports.updateProductSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().min(5),

  main_image: Joi.string().uri(),

  price: Joi.number().min(0),

  discountPrice: Joi.number().min(0).max(Joi.ref("price")).messages({
    "number.max": "discountPrice cannot be greater than price",
  }),

  categories: Joi.array().items(objectId),

  status: Joi.string().valid("active", "inactive"),

  metaTitle: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
  // metaKeywords: Joi.array().items(Joi.string()).optional(),
  metaKeywords: Joi.string().optional(),
}).min(1); // must update at least 1 field
