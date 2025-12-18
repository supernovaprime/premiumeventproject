// backend/routes/organizer.js
router.get("/stats", protect, async (req, res) => {
    if (!req.user.isOrganizer) return res.status(403).json({ message: "Access denied" });
  
    const events = await Event.find({ organizer: req.user.id });
    const eventIds = events.map(e => e._id);
  
    const [tickets, votes] = await Promise.all([
      Ticket.countDocuments({ event: { $in: eventIds } }),
      Vote.countDocuments({ event: { $in: eventIds } })
    ]);
  
    const revenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  
    res.json({
      totalEvents: events.length,
      totalTickets: tickets,
      totalRevenue: revenue,
      totalVotes: votes,
      activeEvents: events.filter(e => e.status === "live").length,
      pendingApproval: events.filter(e => e.status === "pending").length
    });
  });
  
router.get("/recent", protect, async (req, res) => {
    const events = await Event.find({ organizer: req.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title banner date status");
    res.json({ events });
});

router.get("/events", protect, isOrganizer, getOrganizerEvents);
router.post("/events", protect, isOrganizer, upload.single("banner"), createEvent);
router.put("/events/:id", protect, isOrganizer, upload.single("banner"), updateEvent);
router.delete("/events/:id", protect, isOrganizer, deleteEvent);
router.get("/events/:id/analytics", protect, isOrganizer, getEventAnalytics);
router.get("/events/:id/nominees", protect, isOrganizer, getNominees);
router.post("/events/:id/payout", protect, isOrganizer, requestPayout);


// backend/routes/organizer.js
router.get("/events/:id/finances", protect, isOrganizer, async (req, res) => {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ message: "Event not found" });
  
    const gross = event.ticketsSold * event.avgTicketPrice || 0;
    const fee = gross * 0.10;
    const net = gross - fee;
  
    const payouts = await Payout.find({ event: event._id }).sort({ requestedAt: -1 });
  
    res.json({
      grossRevenue: gross,
      platformFee: fee,
      netRevenue: net,
      ticketsSold: event.ticketsSold,
      payoutStatus: payouts[0]?.status || "none",
      payoutHistory: payouts
    });
  });
  
  router.post("/events/:id/payout", protect, isOrganizer, async (req, res) => {
    // Logic to create payout request
  });

// backend/routes/organizer.js
router.get("/events/:id/analytics", protect, isOrganizer, async (req, res) => {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id }).populate("categories nominees");
    if (!event) return res.status(404).json({ message: "Event not found" });
  
    const tickets = await Ticket.find({ event: req.params.id });
    const votes = await Vote.find({ event: req.params.id }).populate("category nominee");
  
    // Ticket sales over time
    const salesMap = {};
    tickets.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString();
      salesMap[date] = (salesMap[date] || 0) + 1;
    });
    const ticketSalesOverTime = Object.keys(salesMap).map(date => ({ date, tickets: salesMap[date] }));
  
    // Vote distribution
    const voteMap = {};
    votes.forEach(v => {
      const cat = v.category.name;
      voteMap[cat] = (voteMap[cat] || 0) + 1;
    });
    const voteDistribution = Object.keys(voteMap).map(cat => ({ category: cat, votes: voteMap[cat] }));
  
    // Top nominees
    const nomineeMap = {};
    votes.forEach(v => {
      const name = v.nominee.name;
      nomineeMap[name] = (nomineeMap[name] || 0) + 1;
    });
    const topNominees = Object.keys(nomineeMap)
      .map(name => ({ name, votes: nomineeMap[name], percentage: ((nomineeMap[name] / votes.length) * 100).toFixed(1) }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
  
    res.json({
      totalTickets: tickets.length,
      totalRevenue: tickets.reduce((sum, t) => sum + t.price, 0),
      totalVotes: votes.length,
      ticketSalesOverTime,
      voteDistribution,
      topNominees
    });
  });

// backend/routes/organizer.js
router.get("/events/:id/nominees", protect, isOrganizer, async (req, res) => {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id }).populate({
      path: "categories",
      populate: { path: "nominees", select: "name image votes isWinner" }
    });
    res.json({ categories: event.categories });
  });
  
  router.post("/nominees/:id/image", protect, upload.single("image"), async (req, res) => {
    const nominee = await Nominee.findById(req.params.id);
    nominee.image = `/uploads/nominees/${req.file.filename}`;
    await nominee.save();
    res.json({ success: true });
  });
  
  router.put("/nominees/:id", protect, async (req, res) => {
    const nominee = await Nominee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(nominee);
  });
  
  router.delete("/nominees/:id", protect, async (req, res) => {
    await Nominee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });
  
  router.post("/events/:id/winner", protect, isOrganizer, async (req, res) => {
    const event = await Event.findById(req.params.id);
    // Reset previous winner
    await Nominee.updateMany({ category: { $in: event.categories } }, { isWinner: false });
    // Set new winner
    await Nominee.findByIdAndUpdate(req.body.nomineeId, { isWinner: true });
    res.json({ success: true });
  });

// backend/routes/organizer.js
// backend/routes/organizer.js

import { protect } from "../middleware/auth.js";
import { isOrganizer } from "../middleware/roles.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Payout from "../models/Payout.js";

// GET: /api/organizer/events/:id/payouts
router.get("/events/:id/payouts", protect, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const tickets = await Ticket.find({ event: req.params.id });
    const gross = tickets.reduce((sum, t) => sum + t.price, 0);
    const platformFee = gross * 0.10;
    const net = gross - platformFee;

    const payouts = await Payout.find({ event: req.params.id }).sort({ requestedAt: -1 });

    const requested = payouts
      .filter(p => p.status !== "rejected")
      .reduce((sum, p) => sum + p.amount, 0);

    const paid = payouts
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const pending = requested - paid;

    res.json({
      gross,
      platformFee,
      net,
      requested,
      paid,
      pending,
      history: payouts.map(p => ({
        amount: p.amount,
        status: p.status,
        requestedAt: p.requestedAt,
        paidAt: p.paidAt || null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: /api/organizer/events/:id/payout
router.post("/events/:id/payout", protect, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const tickets = await Ticket.find({ event: req.params.id });
    const gross = tickets.reduce((sum, t) => sum + t.price, 0);
    const platformFee = gross * 0.10;
    const net = gross - platformFee;

    const payouts = await Payout.find({ event: req.params.id });
    const requested = payouts
      .filter(p => p.status !== "rejected")
      .reduce((sum, p) => sum + p.amount, 0);

    const available = net - requested;
    if (available <= 0) {
      return res.status(400).json({ message: "No funds available for payout" });
    }

    const payout = new Payout({
      event: req.params.id,
      organizer: req.user.id,
      amount: available,
      status: "pending"
    });

    await payout.save();
    res.json({ success: true, payout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});