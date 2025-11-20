const User = require("../models/User");

exports.register = async (req, res, next) => {
  try {
    const { name, email, username, password, passwordConfirm, photo } =
      req.body;

    // **TODO: Validate inputs here

    // Create user
    const newUser = await User.create({
      name,
      username,
      email,
      password,
      passwordConfirm,
      photo,
    });

    // **TODO: Send JWT or email verification

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.login = (req, res) => {};
exports.logout = (req, res) => {};
