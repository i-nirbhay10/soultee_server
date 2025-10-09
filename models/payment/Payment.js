// models/Payment.js
const mongoose = require("mongoose");
const User = require("../user_model/user");

const PaymentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  serviceId: { type: String },
  type: { type: String, enum: ["one-time", "subscription"], required: true },
  offerId: String,
  planId: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentProvider: String, // e.g., "razorpay"
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  razorpaySubscriptionId: String,
  createdAt: { type: Date, default: Date.now },
  verifiedAt: Date,
});

module.exports = mongoose.model("Payment", PaymentSchema);
