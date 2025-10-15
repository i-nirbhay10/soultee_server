const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  createSubscription,
  confirmSubscriptionPayment,
} = require("../../controllers/paymentController");

// Create Razorpay order for one-time offer
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.post("/create-subscription", createSubscription);
router.post("/confirm-subscription-payment", confirmSubscriptionPayment);

module.exports = router;
