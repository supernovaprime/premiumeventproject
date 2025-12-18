// backend/routes/affiliate.js
import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// GET /api/affiliate/stats
router.get("/stats", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  const referrals = user.referrals || [];
  const clicks = user.clicks || 0;
  const totalEarned = referrals.reduce((sum, r) => sum + r.earned, 0);
  const paidOut = user.paidOut || 0;
  const pendingPayout = totalEarned - paidOut;

  res.json({
    referralCode: user.referralCode,
    referrals: referrals.length,
    clicks,
    conversions: referrals.filter(r => r.converted).length,
    totalEarned,
    paidOut,
    pendingPayout,
    commissionRate: 10
  });
});

// backend/routes/affiliate.js

// GET /api/affiliate/referrals/all
router.get("/referrals/all", protect, async (req, res) => {
    const user = await User.findById(req.user.id).populate("referrals.event");
    const referrals = (user.referrals || []).map(r => ({
      name: r.name,
      email: r.email,
      event: r.event ? { title: r.event.title } : null,
      amount: r.amount,
      commission: r.commission,
      status: r.status,
      date: r.date
    }));
    res.json({ referrals });
  });
  
  // backend/routes/affiliate.js
  
  // GET /api/affiliate/earnings
  router.get("/earnings", protect, async (req, res) => {
    const user = await User.findById(req.user.id).populate("referrals.event");
    const range = req.query.range || "all";
    const now = new Date();
    let startDate;
  
    if (range === "week") startDate = new Date(now.setDate(now.getDate() - 7));
    else if (range === "month") startDate = new Date(now.setMonth(now.getMonth() - 1));
    else if (range === "year") startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    else startDate = new Date(0);
  
    const referrals = (user.referrals || []).filter(r => new Date(r.date) >= startDate);
  
    const totalEarned = referrals.reduce((sum, r) => sum + r.commission, 0);
    const paidOut = referrals.filter(r => r.status === "paid").reduce((sum, r) => sum + r.commission, 0);
    const pending = totalEarned - paidOut;
  
    // Monthly aggregation
    const monthly = {};
    referrals.forEach(r => {
      const month = new Date(r.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthly[month]) monthly[month] = { earned: 0, paid: 0 };
      monthly[month].earned += r.commission;
      if (r.status === "paid") monthly[month].paid += r.commission;
    });
  
    const monthlyData = Object.keys(monthly).map(m => ({
      month: m,
      earned: monthly[m].earned,
      paid: monthly[m].paid
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  
    const payoutHistory = referrals.map(r => ({
      date: r.date,
      event: r.event ? { title: r.event.title } : null,
      referral: { name: r.name },
      sale: r.amount,
      commission: r.commission,
      status: r.status
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  
    res.json({
      totalEarned,
      paidOut,
      pending,
      monthlyData,
      payoutHistory
    });
  });

// backend/routes/affiliate.js

// GET /api/affiliate/balance
router.get("/balance", protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    const earned = user.referrals?.reduce((s, r) => s + r.commission, 0) || 0;
    const requested = user.payouts?.filter(p => p.status !== "completed").reduce((s, p) => s + p.amount, 0) || 0;
    const available = earned - requested;
    res.json({ available, requested });
  });
  
  // GET /api/affiliate/payouts
  router.get("/payouts", protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    const payouts = (user.payouts || []).map(p => ({
      amount: p.amount,
      status: p.status,
      requestedAt: p.requestedAt,
      paidAt: p.paidAt
    })).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    res.json({ payouts });
  });
  
  // POST /api/affiliate/payouts/request
  router.post("/payouts/request", protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    const earned = user.referrals?.reduce((s, r) => s + r.commission, 0) || 0;
    const requested = user.payouts?.filter(p => p.status !== "completed").reduce((s, p) => s + p.amount, 0) || 0;
    const available = earned - requested;
  
    if (available < 50) throw new Error("Minimum payout is GHS 50");
  
    user.payouts.push({
      amount: available,
      status: "pending",
      requestedAt: new Date()
    });
    await user.save();
  
    res.json({ success: true });
  });
  
  // GET /api/affiliate/bank
  router.get("/bank", protect, async (req, res) => {
    const user = await User.findById(req.user.id).select("bank");
    res.json({ bank: user.bank || null });
  });
  
  // PUT /api/affiliate/bank
  router.put("/bank", protect, async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, { bank: req.body }, { new: true });
    res.json({ bank: user.bank });
  });


export default router;