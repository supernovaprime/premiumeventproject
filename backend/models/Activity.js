// backend/models/Activity.js
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["event", "user", "payout", "ticket", "login", "approval"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ user: 1 });

export default mongoose.model("Activity", activitySchema);