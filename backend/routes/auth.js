// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js"; // or your email service
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  // ... your existing register logic
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  // ... your existing login logic
});

// @route   POST /api/auth/verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
  // ... your existing verify email
});

// ————————————————————————————————————————
// NEW: FORGOT PASSWORD FLOW (ADD BELOW)
// ————————————————————————————————————————

// 1. Request Password Reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="color: #4f46e5;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: "Password Reset - Job Design",
      html: message,
    });

    res.json({ message: "Reset link sent to email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// 2. Validate Reset Token (Frontend calls this on page load)
router.get("/validate-reset-token/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    res.json({ message: "Token valid" });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// 3. Reset Password
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ————————————————————————————————————————
// END OF NEW ROUTES
// ————————————————————————————————————————
// backend/routes/auth.js
router.get("/verify-email/:token", async (req, res) => {
    try {
      const user = await User.findOne({
        emailToken: req.params.token,
        emailTokenExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token." });
      }
  
      user.isVerified = true;
      user.emailToken = undefined;
      user.emailTokenExpires = undefined;
      await user.save();
  
      res.json({ message: "Email verified successfully." });
    } catch (err) {
      res.status(500).json({ message: "Server error." });
    }
  });
  
  router.post("/resend-verification", protect, async (req, res) => {
    if (req.user.isVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }
  
    const token = crypto.randomBytes(32).toString("hex");
    req.user.emailToken = token;
    req.user.emailTokenExpires = Date.now() + 3600000;
    await req.user.save();
  
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    await sendEmail({
      to: req.user.email,
      subject: "Verify Your Email - Job Design",
      html: `<p>Click to verify: <a href="${verifyUrl}">Verify Email</a></p>`,
    });
  
    res.json({ message: "Verification email sent." });
  });
export default router;