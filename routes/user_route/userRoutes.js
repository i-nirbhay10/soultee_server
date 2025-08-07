const express = require("express");
const {
  registerUser,
  verifyEmail,
  loginUser,
  completeUserProfile,
  getUserByUNID,
} = require("../../controllers/user_Controller/userController");
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/completeProfile", completeUserProfile);
router.get("/getUserByUNID", getUserByUNID);

module.exports = router;
