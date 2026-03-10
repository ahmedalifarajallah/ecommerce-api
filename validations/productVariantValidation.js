const Joi = require("joi");
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message("Invalid Id");

// ==============================
// CREATE PRODUCT VARIANT VALIDATION
// ==============================
exports.createProductVariantSchema = Joi.object({
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
}).unknown(false);

// ==============================
// UPDATE PRODUCT VARIANT VALIDATION
// ==============================
exports.updateProductVariantSchema = Joi.object({
  _id: objectId.optional().allow(null),
  attributes: Joi.object().optional(),
  price: Joi.number().optional(),
  discountPrice: Joi.number().optional(),
  quantity: Joi.number().optional(),
  images: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.object()))
    .optional(),
  isAvailable: Joi.boolean().optional(),
}).unknown(false);
