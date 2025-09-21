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
      // required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    //     mobile: { type: String, required: true },
    // userType: {
    //   type: String,
    //   enum: ['Individual', 'Agency', 'Company'],
    //   default: 'Individual',
    // },
    // agency: {
    //   agencyName: { type: String },
    //   agencyAddress: { type: String },
    //   agencyEmail: { type: String },
    // },
    // company: {
    //   companyName: { type: String },
    //   companyAddress: { type: String },
    //   companyEmail: { type: String },
    // },
    password: {
      type: String,
      required: true,
      // minlength: 6,
      // select: false // optional: hides password in queries unless explicitly selected
    },
    phone: {
      type: String,
      required: false,
      sparse: true, // allows multiple nulls
      unique: true, // ensures uniqueness if provided
      trim: true,
    },
    avatar: {
      type: String,
      default: "/placeholder-user.jpg",
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
