const router = require("express").Router();
const {
  registerUser,
  loginUser,
  currentUser,
  forgetPassword,
  resetPassword,
} = require("../controllers/UserController");
const { validateJWTToken } = require("../middleware/authorizationMiddleware");
const userModel = require("../models/userSchema");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getCurrentUser", validateJWTToken, currentUser);
router.post("/forgetPassword", forgetPassword);
router.post("/resetPassword", resetPassword);

module.exports = router;
