const Joi = require("joi");

exports.seoSchemaValidate = Joi.object({
  title: Joi.string().allow("").max(150),
  description: Joi.string().allow("").max(300),
  keywords: Joi.array().items(Joi.string().trim()).default([]),
});
