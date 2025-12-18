// models/Settings.js
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  siteName: String,
  siteUrl: String,
  logo: String,
  primaryColor: String,
  platformFee: Number,
  emailFrom: String,
  smtpHost: String,
  smtpPort: String,
  smtpUser: String,
  smtpPass: String,
  enable2FA: Boolean,
  maintenanceMode: Boolean
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);