// models/Service.js
const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    description: String,
    price: Number,
    deliveryTime: String,
    features: [String],
    image: String,
  },
  { _id: false }
);

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  popular: [String],
  subscriptionPlan: {
    id: String,
    name: String,
    description: String,
    price: Number,
    deliveryTime: String,
    features: [String],
  },
  popularOffers: { type: Map, of: [OfferSchema] }, // key: popular name -> array of OfferSchema
  faqs: [{ question: String, answer: String }],
  testimonials: [{ name: String, quote: String }],
  related: [String],
});

module.exports = mongoose.model("Service", ServiceSchema);
