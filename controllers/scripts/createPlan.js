// scripts/createPlan.js
import dotenv from "dotenv";
dotenv.config();

import razorpay from "razorpay";
import mongoose from "mongoose";
import Service from "../../models/services/Service";

const razor = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

(async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 1. Create Razorpay plan
    const plan = await razor.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: "Digital Growth Monthly Plan",
        amount: 99900, // ₹999 in paise
        currency: "INR",
        description: "Full access to digital marketing services.",
      },
    });

    // 2. Save plan ID in service DB
    const service = await Service.findOne({ name: "Digital Marketing" });
    if (!service) throw new Error("Service not found");

    service.subscriptionPlan = {
      planId: plan.id,
    };
    await service.save();

    console.log("✅ Plan created and stored:", plan.id);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating plan:", err);
    process.exit(1);
  }
})();
