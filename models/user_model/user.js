const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    UNID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: false, // Now optional – will validate in controller
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    email: {
      type: String,
      required: false, // Now optional – will validate in controller
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ["Individual", "Agency", "Company"],
      default: "Individual",
    },
    agency: {
      agencyName: { type: String, trim: true },
      agencyAddress: { type: String, trim: true },
      agencyEmail: { type: String, trim: true, lowercase: true },
    },
    company: {
      companyName: { type: String, trim: true },
      companyAddress: { type: String, trim: true },
      companyEmail: { type: String, trim: true, lowercase: true },
    },
    password: {
      type: String,
      required: true,
      // minlength: 6,
      // select: false, // optional: hides password in queries unless explicitly selected
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },

    joinDate: {
      type: Date,
      required: true,
    },
    lastActive: {
      type: Date,
    },

    totalBookings: {
      type: Number,
      default: 0,
    },
    completedBookings: {
      type: Number,
      default: 0,
    },
    cancelledBookings: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    accountType: {
      type: String,
      enum: ["basic", "premium", "enterprise"],
      default: "basic",
    },
    isLowProspective: {
      type: Boolean,
      default: false,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: true,
      },
    },
    recentActivity: [
      {
        action: String,
        date: Date,
        details: String,
      },
    ],
    subscriptions: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Service", // optional, if you have a Service model
        },
        planId: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["active", "expired", "canceled"],
          default: "active",
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        paymentId: {
          type: String,
          required: true,
        },
      },
    ],
    payAsYouGoHistory: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Service",
        },
        offerId: {
          type: String,
          required: true,
        },
        paymentId: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
