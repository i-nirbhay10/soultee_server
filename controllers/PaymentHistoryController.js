// controllers/PaymentController.js

const Payment = require("../models/payment/Payment");
const mongoose = require("mongoose");

// @desc   Get all payment history for a user
// @route  GET /api/user-payments/:userId
exports.getUserPaymentHistory = async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const payments = await Payment.find({ clientId: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ payments });
  } catch (err) {
    console.error("Error fetching payment history:", err);
    res.status(500).json({ error: "Failed to load payment history" });
  }
};

// @desc   Get single payment by ID
// @route  GET /api/user-payments/payment/:paymentId
exports.getSinglePayment = async (req, res) => {
  const { paymentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res.status(400).json({ error: "Invalid payment ID" });
  }

  try {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json({ payment });
  } catch (err) {
    console.error("Error fetching payment:", err);
    res.status(500).json({ error: "Failed to load payment" });
  }
};

// @desc   Get 5 most recent payments for user
// @route  GET /api/user-payments/recent/:userId
exports.getUserRecentPayments = async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const payments = await Payment.find({ clientId: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({ payments });
  } catch (err) {
    console.error("Error fetching recent payments:", err);
    res.status(500).json({ error: "Failed to load recent payments" });
  }
};
