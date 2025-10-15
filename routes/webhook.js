const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { handleRazorpayWebhook } = require("../controllers/webhookController");

// Use raw body parser for webhook verification
router.post(
  "/razorpay",
  bodyParser.raw({ type: "*/*" }),
  handleRazorpayWebhook
);

// router.post(
//   "/razorpay",
//   bodyParser.raw({ type: "application/json" }), // not '*/*'
//   handleRazorpayWebhook
// );

module.exports = router;
