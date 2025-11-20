const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  // check if token exist
  if (
    req.headers.authorization &&
    req.header.authorization.startWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in! Please login.", 401));
  }

  // verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // check if user exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("The user no longer exists.", 401));
  }

  req.user = currentUser;
  next();
};
