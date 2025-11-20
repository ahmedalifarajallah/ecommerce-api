const AppError = require("../utils/AppError");

const validateRequest = (schema, data) => {
  const { error } = schema.validate(data, { abortEarly: false });

  if (error) {
    const messages = error.details.map((el) => el.message).join(". ");
    throw new AppError(messages, 400);
  }
};

module.exports = validateRequest;
