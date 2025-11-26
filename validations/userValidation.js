const Joi = require("joi");

exports.signupSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be less than 50 characters",
  }),
  username: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must be less than 50 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
  passwordConfirm: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "string.empty": "Confirm password is required",
  }),
  role: Joi.string().valid("user", "admin", "super-admin").default("user"),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

exports.updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current Password is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
  passwordConfirm: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "string.empty": "Confirm password is required",
  }),
});

exports.updateMeSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be less than 50 characters",
  }),

  username: Joi.string().min(3).max(50).optional().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must be less than 50 characters",
  }),

  email: Joi.string().email().optional().messages({
    "string.email": "Email must be a valid email address",
  }),

  photo: Joi.string().optional(),

  password: Joi.forbidden().messages({
    "any.unknown":
      "You cannot update your password here. Use /update-password.",
  }),

  passwordConfirm: Joi.forbidden().messages({
    "any.unknown":
      "You cannot update your password here. Use /update-password.",
  }),

  role: Joi.forbidden().messages({
    "any.unknown": "You are not allowed to change your role.",
  }),

  active: Joi.forbidden(),
});

exports.adminUpdateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  username: Joi.string().optional(),
  role: Joi.string().valid("user", "admin", "super-admin").optional(),
  active: Joi.boolean().optional(),
  photo: Joi.string().optional(),
});
