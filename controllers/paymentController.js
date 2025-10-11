const Razorpay = require("razorpay");
const Payment = require("../models/payment/Payment");
const Service = require("../models/services/Service");
const User = require("../models/user_model/user");
const { verifyOrderSignature } = require("../utils/razorpayVerify");

const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Controller to create order
exports.createOrder = async (req, res) => {
  try {
    const { userId, serviceId, offerId, offerName } = req.body;
    console.log(userId, serviceId, offerId, offerName);

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Find selected offer in service.popularOffers
    let offer;
    for (const offers of service.popularOffers.values()) {
      offer = offers.find((o) => o.id === offerId);
      if (offer) break;
    }

    console.log(offer);

    if (!offer) {
      return res.status(400).json({ error: "Offer not found" });
    }

    const amountPaise = Math.round(offer.price * 100); // Razorpay uses paise

    const receipt = `rec_${offerId}_${Date.now()}`.slice(0, 40);

    const order = await razor.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
    });

    const paymentDoc = await Payment.create({
      clientId: userId,
      serviceId,
      type: "one-time",
      offerId,
      offerName,
      amount: offer.price,
      paymentProvider: "razorpay",
      status: "pending",
      razorpayOrderId: order.id,
    });

    res.status(200).json({
      order,
      paymentId: paymentDoc._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "create-order failed" });
  }
};

// Controller to verify payment
exports.verifyPayment = async (req, res) => {
  try {
    console.log("🔐 Payment verification started.");

    const {
      paymentId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    console.log("📦 Request Body:", {
      paymentId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.warn("❌ Payment not found for ID:", paymentId);
      return res.status(404).json({ error: "Payment not found" });
    }

    console.log("✅ Payment found in DB:", payment._id);

    const isValid = verifyOrderSignature(
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      process.env.RAZORPAY_KEY_SECRET
    );

    console.log("🔍 Signature verification result:", isValid);

    if (!isValid) {
      payment.status = "failed";
      await payment.save();
      console.warn("❌ Invalid signature. Payment marked as failed.");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Update payment details
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "completed";
    payment.verifiedAt = new Date();
    await payment.save();
    console.log("💾 Payment updated and marked as completed:", payment._id);

    // Update user record
    await User.findByIdAndUpdate(payment.clientId, {
      $push: {
        payg: {
          serviceId: payment.serviceId,
          offerId: payment.offerId,
          paymentId: payment._id,
        },
      },
    });

    console.log("👤 User updated with pay-as-you-go info:", payment.clientId);

    res.status(200).json({ ok: true });
    console.log("✅ Payment verification successful.");
  } catch (error) {
    console.error("❗ Payment verification failed:", error);
    res.status(500).json({ error: "verify failed" });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const { userId, serviceId, planId } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: "Service not found" });

    const plan = service.subscriptionPlan;
    if (!plan || plan.id !== planId) {
      return res.status(400).json({ error: "Plan mismatch" });
    }

    // If you have a plan_id created on Razorpay dashboard, use it here:
    // const razorpayPlanId = plan.razorpayPlanId;

    // Otherwise, create subscription directly (without Razorpay plan_id)
    // NOTE: Razorpay strongly recommends creating plan on dashboard first and using plan_id here
    const subscription = await razor.subscriptions.create({
      plan_id: undefined, // set your razorpayPlanId here if you have one
      total_count: 12, // Number of billing cycles (optional)
      customer_notify: 1, // Notify customer via email/sms
      // You can add addons, quantity, etc. if needed
    });

    const paymentDoc = await Payment.create({
      clientId: userId,
      serviceId,
      type: "subscription",
      planId,
      amount: plan.price,
      paymentProvider: "razorpay",
      status: "pending",
      razorpaySubscriptionId: subscription.id,
    });

    res.status(200).json({
      subscription,
      paymentId: paymentDoc._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create subscription failed:", error);
    res.status(500).json({ error: "create subscription failed" });
  }
};
