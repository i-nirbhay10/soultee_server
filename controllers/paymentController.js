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
    const { userId, serviceId, planId, customerName, customerEmail } = req.body;

    console.log("✅ [STEP 1] - Create Subscription triggered");
    console.log("  └─ userId:", userId);
    console.log("  └─ serviceId:", serviceId);
    console.log("  └─ planId:", planId);
    console.log(
      "  └─ customerName:",
      customerName,
      "└─ customerEmail:",
      customerEmail
    );

    // STEP 2: Fetch Service
    const service = await Service.findById(serviceId);
    if (!service) {
      console.warn("❌ [STEP 2] - Service not found");
      return res.status(404).json({ error: "Service not found" });
    }
    console.log("✅ [STEP 2] - Service found:", service.name || service._id);

    // STEP 3: Validate Plan
    const plan = service.subscriptionPlan;

    if (!plan || plan.planId !== planId) {
      console.warn("❌ [STEP 3] - Plan mismatch or not found");
      return res.status(400).json({ error: "Plan mismatch" });
    }
    console.log("✅ [STEP 3] - Subscription plan validated");

    // STEP 4: Create Razorpay Subscription
    console.log("📦 [STEP 4] - Creating Razorpay subscription...");

    const subscription = await razor.subscriptions.create({
      plan_id: planId, // Razorpay plan ID
      total_count: 12, // 12 billing cycles
      customer_notify: 1, // Notify customer via SMS/email
    });

    console.log(
      "✅ [STEP 4] - Razorpay subscription created:",
      subscription.id
    );

    // STEP 5: Save payment entry in DB
    console.log("📝 [STEP 5] - Creating Payment document...");

    const paymentDoc = await Payment.create({
      clientId: userId,
      serviceId,
      type: "subscription",
      planId,
      amount: plan.price,
      offerName: plan.offerName,
      paymentProvider: "razorpay",
      status: "pending",
      razorpaySubscriptionId: subscription.id,
    });

    console.log("✅ [STEP 5] - Payment document created:", paymentDoc._id);

    // STEP 6: Return response
    console.log("✅ [STEP 6] - Subscription creation complete");
    res.status(200).json({
      subscriptionId: subscription.id,
      subscription,
      paymentId: paymentDoc._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ [ERROR] Create subscription failed:", error);
    res.status(500).json({ error: "create subscription failed" });
  }
};

exports.confirmSubscriptionPayment = async (req, res) => {
  try {
    console.log("✅ [STEP 1] - Subscription payment confirmation triggered");

    const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;

    console.log("ℹ️ [STEP 2] - Request Body:");
    console.log("  └─ paymentId:", paymentId);
    console.log("  └─ razorpayPaymentId:", razorpayPaymentId);
    console.log("  └─ razorpaySignature:", razorpaySignature);

    if (!paymentId || !razorpayPaymentId) {
      console.warn("❌ [STEP 2] - Missing required fields");
      return res
        .status(400)
        .json({ error: "Missing paymentId or razorpayPaymentId" });
    }

    // Optional: verify Razorpay payment signature (uncommon in subscription flow)
    // Uncomment if you store subscription order creation details locally
    /*
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayPaymentId}|${paymentId}`) // or your unique string
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.warn("❌ [STEP 3] - Signature verification failed");
      return res.status(400).json({ error: "Invalid signature" });
    }
    console.log("✅ [STEP 3] - Signature verified");
    */

    console.log("🔍 [STEP 3] - Fetching payment from DB...");
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      console.warn("❌ [STEP 3] - Payment not found for ID:", paymentId);
      return res.status(404).json({ error: "Payment not found" });
    }

    console.log("✅ [STEP 4] - Payment found:", payment._id);

    // Update payment status
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = "active";
    payment.verifiedAt = new Date();
    await payment.save();

    console.log("✅ [STEP 5] - Payment updated successfully");

    // TODO: Update user's subscription access here if needed
    // Example:
    // await User.findByIdAndUpdate(payment.clientId, { isSubscribed: true });

    console.log("✅ [STEP 6] - Subscription confirmation complete");
    return res
      .status(200)
      .json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    console.error(
      "❌ [ERROR] Subscription payment confirmation failed:",
      error
    );
    return res.status(500).json({ error: "Payment confirmation failed" });
  }
};
