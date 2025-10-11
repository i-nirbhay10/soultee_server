const Razorpay = require("razorpay");
const Payment = require("../models/payment/Payment");
const Service = require("../models/services/Service");
const User = require("../models/user_model/user");
const { verifyWebhookSignature } = require("../utils/razorpayVerify");

const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const payload = req.body.toString();
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const isValid = verifyWebhookSignature(payload, signature, secret);
    if (!isValid) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(payload);

    switch (event.event) {
      case "payment.captured": {
        const paymentData = event.payload.payment.entity;

        await Payment.findOneAndUpdate(
          { razorpayOrderId: paymentData.order_id },
          {
            razorpayPaymentId: paymentData.id,
            status: "completed",
            verifiedAt: new Date(),
          }
        );

        // TODO: Optionally update user's payment history here
        break;
      }

      case "subscription.charged": {
        const subData = event.payload.subscription.entity;

        // TODO: Find Payment doc by `subData.id` or other unique fields
        // Update payment cycle status or history

        break;
      }

      case "subscription.cancelled":
      case "subscription.paused": {
        const subData = event.payload.subscription.entity;

        // TODO: Update user's subscription status accordingly

        break;
      }

      // Add more Razorpay events as needed
      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }

    res.status(200).send("ok");
  } catch (error) {
    console.error("Webhook processing failed:", error);
    res.status(500).send("Internal Server Error");
  }
};
