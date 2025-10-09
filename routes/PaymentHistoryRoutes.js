const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentHistoryController");

// List all payments for a user
router.get("/:userId", PaymentController.getUserPaymentHistory);

// Get a single payment
router.get("/payment/:paymentId", PaymentController.getSinglePayment);

// Get recent payments
router.get("/recent/:userId", PaymentController.getUserRecentPayments);

module.exports = router;
