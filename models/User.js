const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: String,
    emailVerificationExpires: Date,
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minlength: 3,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: true,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ["super-admin", "admin", "user"],
      default: "user",
    },
    photo: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createEmailVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.emailVerificationCode = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
