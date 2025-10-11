const userModel = require("../models/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const EmailHelper = require("../utils/emailHelper");

const registerUser = async (req, res) => {
  try {
    const userExists = await userModel.findOne({ email: req?.body?.email });
    if (userExists) {
      const error = new Error("User Already Exists");
      error.status = 409;
      return next(error);
    }
    // hash the password
    const salt = await bcrypt.genSalt(10); // 2^10
    const hashPassword = await bcrypt.hash(req?.body?.password, salt);
    req.body.password = hashPassword;
    const newUser = new userModel(req?.body);
    await newUser.save();
    res.send({
      success: true,
      message: "Registration Successful, Please Login",
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const user = await userModel.findOne({ email: req?.body?.email });
    if (!user) {
      const error = new Error("User doesn't exist, please register");
      error.status = 404;
      return next(error);
    }
    const validatePassword = await bcrypt.compare(
      req?.body?.password,
      user.password
    );
    if (!validatePassword) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      return next(error);
    }
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    res.cookie("tokenForBMS", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.send({
      success: true,
      message: "Welcome to BookMyShow",
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

// Logout controller to clear the cookie
const logoutUser = async (req, res) => {
  res.clearCookie("tokenForBMS");
  res.send({
    success: true,
    message: "Logged out successfully",
  });
};

const currentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("-password");
    res.send({
      success: true,
      message: "User Details Fetched Successfully",
      data: user,
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (email === undefined) {
      const error = new Error("Please enter the email for forget Password");
      error.status = 400;
      return next(error);
    }
    let user = await userModel.findOne({ email: email });
    if (user === null) {
      const error = new Error("user not found");
      error.status = 404;
      return next(error);
    } else if (user?.otp != undefined && user.otp < Date.now()) {
      const error = new Error("Please use otp sent on mail");
      error.status = 400;
      return next(error);
    }
    const otp = Math.floor(Math.random() * 10000 + 90000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    await EmailHelper("otp.html", user.email, {
      name: user.name,
      otp: otp,
    });
    res.status(200).json({
      success: true,
      message: "otp has been sent",
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, otp } = req.body;
    if (password == undefined || otp == undefined) {
      const error = new Error("invalid request");
      error.status = 400;
      return next(error);
    }
    const user = await userModel.findOne({ otp: otp });
    if (user == null) {
      const error = new Error("user not found");
      error.status = 404;
      return next(error);
    }
    if (Date.now() > user.otpExpiry) {
      const error = new Error("otp expired");
      error.status = 401;
      return next(error);
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req?.body?.password, salt);
    user.password = hashPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    res.status(200).json({
      success: true,
      message: "password reset successfully",
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  forgetPassword,
  resetPassword,
};
