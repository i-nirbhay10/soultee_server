const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const webhookController = require("../controllers/webhookController");

// Use raw body parser for webhook verification
router.post(
  "/razorpay",
  bodyParser.raw({ type: "*/*" }),
  webhookController.handleRazorpayWebhook
);

module.exports = router;
