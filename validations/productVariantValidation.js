const Joi = require("joi");

// ==============================
// CREATE PRODUCT VARIANT VALIDATION
// ==============================
exports.createProductVariantSchema = Joi.object({
  // product: objectId.required(),
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
