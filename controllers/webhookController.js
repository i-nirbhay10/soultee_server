const Payment = require("../models/payment/Payment");
const User = require("../models/user_model/user");
// const Service = require("../models/services/Service");
// const Razorpay = require("razorpay");
const { verifyWebhookSignature } = require("../utils/razorpayVerify");

exports.handleRazorpayWebhook = async (req, res) => {
  console.log("✅ [STEP 1] - Webhook handler triggered");

  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  console.log("ℹ️ [STEP 2] - Incoming Request Details");
  console.log("  └─ Signature received:", signature ? "Yes" : "No");
  console.log("  └─ Type of req.body:", typeof req.body);
  console.log("  └─ Is req.body a buffer:", Buffer.isBuffer(req.body));

  const payload = req.body;

  // Validate webhook signature
  console.log("🛡️ [STEP 3] - Verifying webhook signature...");
  const isValid = verifyWebhookSignature(payload, signature, secret);
  console.log("  └─ Signature valid?", isValid);

  if (!isValid) {
    console.error("❌ Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  console.log("✅ [STEP 4] - Signature verified");

  let event;
  try {
    console.log("📦 [STEP 5] - Parsing event payload...");
    event = JSON.parse(payload);
    console.log("  └─ Event type:", event.event);
  } catch (err) {
    console.error("❌ Payload parsing failed:", err);
    return res.status(400).send("invalid payload");
  }

  try {
    switch (event.event) {
      case "payment.captured": {
        console.log("💰 [STEP 6] - Handling 'payment.captured'");

        const paymentEntity = event.payload.payment.entity;
        console.log("  └─ Payment ID:", paymentEntity.id);
        console.log("  └─ Order ID:", paymentEntity.order_id);

        const paymentDoc = await Payment.findOneAndUpdate(
          { razorpayOrderId: paymentEntity.order_id },
          {
            razorpayPaymentId: paymentEntity.id,
            status: "completed",
            verifiedAt: new Date(),
          },
          { new: true }
        );

        if (paymentDoc) {
          console.log("  ✔ Payment document updated:", paymentDoc._id);

          await User.findByIdAndUpdate(paymentDoc.clientId, {
            $push: {
              payg: {
                serviceId: paymentDoc.serviceId,
                offerId: paymentDoc.offerId,
                paymentId: paymentDoc._id,
              },
            },
          });
          console.log("  ✔ User payg history updated");
        } else {
          console.warn("⚠️ No payment document found for the order ID");
        }

        break;
      }

      case "subscription.charged": {
        console.log("🔁 [STEP 6] - Handling 'subscription.charged'");

        const subscriptionEntity = event.payload.subscription.entity;
        const razorpaySubscriptionId = subscriptionEntity.id;

        console.log("  └─ Subscription ID:", razorpaySubscriptionId);

        const paymentDoc = await Payment.findOne({ razorpaySubscriptionId });

        if (paymentDoc) {
          console.log("  ✔ Payment document found:", paymentDoc._id);
          paymentDoc.status = "active";
          await paymentDoc.save();
          console.log("  ✔ Payment document updated to 'active'");
        } else {
          console.warn("⚠️ No payment document found for subscription ID");
        }

        break;
      }

      case "subscription.cancelled":
      case "subscription.paused": {
        console.log(`📴 [STEP 6] - Handling '${event.event}'`);

        const subscriptionEntity = event.payload.subscription.entity;
        const razorpaySubscriptionId = subscriptionEntity.id;

        console.log("  └─ Subscription ID:", razorpaySubscriptionId);

        const updated = await Payment.findOneAndUpdate(
          { razorpaySubscriptionId },
          {
            status:
              event.event === "subscription.cancelled" ? "cancelled" : "paused",
          }
        );

        if (updated) {
          console.log(`  ✔ Subscription marked as '${event.event}'`);
        } else {
          console.warn("⚠️ No matching subscription found to update");
        }

        break;
      }

      default:
        console.log(`ℹ️ [STEP 6] - Unhandled event type: ${event.event}`);
    }

    console.log("✅ [STEP 7] - Webhook processed successfully");
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ [ERROR] Exception while handling webhook:", err);
    res.status(500).send("error");
  }
};

// exports.handleRazorpayWebhook = async (req, res) => {
//   console.log("handle Razorpay Webhook 1");
//   console.log("Type of req.body:", typeof req.body);
//   console.log("Is Buffer:", Buffer.isBuffer(req.body));

//   const signature = req.headers["x-razorpay-signature"];
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   const payload = req.body; // ✅ raw buffer

//   const isValid = verifyWebhookSignature(payload, signature, secret);
//   console.log("Signature valid?", isValid);
//   if (!isValid) {
//     return res.status(400).send("Invalid signature");
//   }

//   console.log("handle Razorpay Webhook 4");
//   let event;
//   try {
//     event = JSON.parse(payload);
//   } catch (err) {
//     console.error("Webhook payload parse error:", err);
//     return res.status(400).send("invalid payload");
//   }
//   console.log(event.event, "paymentEntity");
//   try {
//     switch (event.event) {
//       case "payment.captured": {
//         const paymentEntity = event.payload.payment.entity;
//         // console.log(paymentEntity, "paymentEntity");

//         // Update Payment status by razorpayOrderId
//         const paymentDoc = await Payment.findOneAndUpdate(
//           { razorpayOrderId: paymentEntity.order_id },
//           {
//             razorpayPaymentId: paymentEntity.id,
//             status: "completed",
//             verifiedAt: new Date(),
//           },
//           { new: true }
//         );

//         console.log(paymentDoc, "paymentDoc");
//         if (paymentDoc) {
//           // Optionally update user's purchase history here
//           await User.findByIdAndUpdate(paymentDoc.clientId, {
//             $push: {
//               payg: {
//                 serviceId: paymentDoc.serviceId,
//                 offerId: paymentDoc.offerId,
//                 paymentId: paymentDoc._id,
//               },
//             },
//           });
//         }
//         break;
//       }

//       case "subscription.charged": {
//         const subscriptionEntity = event.payload.subscription.entity;
//         const razorpaySubscriptionId = subscriptionEntity.id;

//         // Find the Payment record for this subscription
//         const paymentDoc = await Payment.findOne({ razorpaySubscriptionId });

//         if (paymentDoc) {
//           // You might want to mark this billing cycle completed,
//           // update subscription status, or track invoices etc.
//           // For example, add subscription payment info to user history

//           // This is a placeholder for subscription payment handling
//           // You can expand based on your business logic
//           paymentDoc.status = "active"; // or other suitable status
//           await paymentDoc.save();
//         }
//         break;
//       }

//       case "subscription.cancelled":
//       case "subscription.paused": {
//         const subscriptionEntity = event.payload.subscription.entity;
//         const razorpaySubscriptionId = subscriptionEntity.id;

//         // Update subscription/payment status accordingly
//         await Payment.findOneAndUpdate(
//           { razorpaySubscriptionId },
//           {
//             status:
//               event.event === "subscription.cancelled" ? "cancelled" : "paused",
//           }
//         );

//         break;
//       }

//       // Handle other events like payment.failed, invoice.failed as needed

//       default:
//         console.log(`Unhandled event type: ${event.event}`);
//     }
//     console.log("handle Razorpay Webhook 5");
//     res.status(200).send("ok");
//   } catch (err) {
//     console.error("Webhook handling error:", err);
//     res.status(500).send("error");
//   }
// };

// exports.handleRazorpayWebhook = async (req, res) => {
//   const payload = req.body.toString();
//   const signature = req.headers["x-razorpay-signature"];
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   console.log("handleRazorpayWebhook1");

//   // Verify signature
//   const isValid = verifyWebhookSignature(payload, signature, secret);
//   console.log(isValid);
//   if (!isValid) {
//     console.log("handleRazorpayWebhook4");
//     return res.status(400).send("invalid signature");
//   }

//   let event;
//   try {
//     event = JSON.parse(payload);
//   } catch (err) {
//     console.error("Webhook payload parse error:", err);
//     return res.status(400).send("invalid payload");
//   }

//   try {
//     switch (event.event) {
//       case "payment.captured": {
//         const paymentEntity = event.payload.payment.entity;

//         // Update Payment status by razorpayOrderId
//         const paymentDoc = await Payment.findOneAndUpdate(
//           { razorpayOrderId: paymentEntity.order_id },
//           {
//             razorpayPaymentId: paymentEntity.id,
//             status: "completed",
//             verifiedAt: new Date(),
//           },
//           { new: true }
//         );

//         if (paymentDoc) {
//           // Optionally update user's purchase history here
//           await User.findByIdAndUpdate(paymentDoc.clientId, {
//             $push: {
//               payg: {
//                 serviceId: paymentDoc.serviceId,
//                 offerId: paymentDoc.offerId,
//                 paymentId: paymentDoc._id,
//               },
//             },
//           });
//         }
//         break;
//       }

//       case "subscription.charged": {
//         const subscriptionEntity = event.payload.subscription.entity;
//         const razorpaySubscriptionId = subscriptionEntity.id;

//         // Find the Payment record for this subscription
//         const paymentDoc = await Payment.findOne({ razorpaySubscriptionId });

//         if (paymentDoc) {
//           // You might want to mark this billing cycle completed,
//           // update subscription status, or track invoices etc.
//           // For example, add subscription payment info to user history

//           // This is a placeholder for subscription payment handling
//           // You can expand based on your business logic
//           paymentDoc.status = "active"; // or other suitable status
//           await paymentDoc.save();
//         }
//         break;
//       }

//       case "subscription.cancelled":
//       case "subscription.paused": {
//         const subscriptionEntity = event.payload.subscription.entity;
//         const razorpaySubscriptionId = subscriptionEntity.id;

//         // Update subscription/payment status accordingly
//         await Payment.findOneAndUpdate(
//           { razorpaySubscriptionId },
//           {
//             status:
//               event.event === "subscription.cancelled" ? "cancelled" : "paused",
//           }
//         );

//         break;
//       }

//       // Handle other events like payment.failed, invoice.failed as needed

//       default:
//         console.log(`Unhandled event type: ${event.event}`);
//     }
//     console.log("handleRazorpayWebhook5");
//     res.status(200).send("ok");
//   } catch (err) {
//     console.error("Webhook handling error:", err);
//     res.status(500).send("error");
//   }
// };

// const razor = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// exports.handleRazorpayWebhook = async (req, res) => {
//   try {
//     const payload = req.body.toString();
//     const signature = req.headers["x-razorpay-signature"];
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//     const isValid = verifyWebhookSignature(payload, signature, secret);
//     if (!isValid) {
//       return res.status(400).send("Invalid signature");
//     }

//     const event = JSON.parse(payload);

//     switch (event.event) {
//       case "payment.captured": {
//         const paymentData = event.payload.payment.entity;

//         await Payment.findOneAndUpdate(
//           { razorpayOrderId: paymentData.order_id },
//           {
//             razorpayPaymentId: paymentData.id,
//             status: "completed",
//             verifiedAt: new Date(),
//           }
//         );

//         // TODO: Optionally update user's payment history here
//         break;
//       }

//       case "subscription.charged": {
//         const subData = event.payload.subscription.entity;

//         // TODO: Find Payment doc by `subData.id` or other unique fields
//         // Update payment cycle status or history

//         break;
//       }

//       case "subscription.cancelled":
//       case "subscription.paused": {
//         const subData = event.payload.subscription.entity;

//         // TODO: Update user's subscription status accordingly

//         break;
//       }

//       // Add more Razorpay events as needed
//       default:
//         console.log(`Unhandled Razorpay event: ${event.event}`);
//     }

//     res.status(200).send("ok");
//   } catch (error) {
//     console.error("Webhook processing failed:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };
