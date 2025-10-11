const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { handleRazorpayWebhook } = require("../models/webhookController");

// Use raw body parser for webhook verification
router.post(
  "/razorpay",
  bodyParser.raw({ type: "*/*" }),
  handleRazorpayWebhook
);

module.exports = router;
