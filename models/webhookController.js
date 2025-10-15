// const Payment = require("../models/Payment");
// const User = require("../models/User");
// const { verifyWebhookSignature } = require("../utils/razorpayVerify");

// exports.handleRazorpayWebhook = async (req, res) => {
//   const payload = req.body.toString();
//   const signature = req.headers["x-razorpay-signature"];
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   // Verify signature
//   const isValid = verifyWebhookSignature(payload, signature, secret);
//   if (!isValid) {
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

//     res.status(200).send("ok");
//   } catch (err) {
//     console.error("Webhook handling error:", err);
//     res.status(500).send("error");
//   }
// };
