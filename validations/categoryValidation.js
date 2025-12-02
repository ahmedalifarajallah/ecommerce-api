const Joi = require("joi");
const mongoose = require("mongoose");

// Custom validator to ensure valid MongoID
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

exports.createCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  status: Joi.string().valid("active", "inactive").default("active"),
  parentCategory: Joi.string().custom(objectId).allow(null).optional(),
  metaTitle: Joi.string().allow("").optional(),
  metaDescription: Joi.string().allow("").optional(),
  metaKeywords: Joi.array().items(Joi.string()).optional(),
}).unknown(false);

exports.updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  status: Joi.string().valid("active", "inactive").optional(),
  parentCategory: Joi.string().custom(objectId).allow(null).optional(),
  metaTitle: Joi.string().allow("").optional(),
  metaDescription: Joi.string().allow("").optional(),
  metaKeywords: Joi.array().items(Joi.string()).optional(),
}).unknown(false);
