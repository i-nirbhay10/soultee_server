// utils/razorpayVerify.js
const crypto = require("crypto");

function verifyOrderSignature(
  { razorpay_order_id, razorpay_payment_id, razorpay_signature },
  secret
) {
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === razorpay_signature;
}

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

module.exports = { verifyOrderSignature, verifyWebhookSignature };
