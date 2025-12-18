// backend/routes/admin.js
import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Payout from "../models/Payout.js";   
import Activity from "../models/Activity.js";  // Optional: for activity log

const router = express.Router();

// Middleware: Only Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};

// GET: /api/admin/stats
router.get("/stats", protect, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrganizers,
      totalEvents,
      pendingEvents,
      totalTickets,
      pendingPayouts
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ isOrganizer: true }),
      Event.countDocuments(),
      Event.countDocuments({ status: "pending" }),
      Ticket.countDocuments(),
      Payout.find({ status: "pending" }).select("amount")
    ]);

    const tickets = await Ticket.find();
    const totalRevenue = tickets.reduce((sum, t) => sum + t.price, 0);
    const platformEarnings = totalRevenue * 0.10;
    const pendingPayoutAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalUsers,
      totalOrganizers,
      totalEvents,
      pendingEvents,
      totalTickets: tickets.length,
      totalRevenue,
      platformEarnings,
      pendingPayouts: pendingPayoutAmount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: /api/admin/recent (Optional Activity Log)
router.get("/recent", protect, isAdmin, async (req, res) => {
  try {
    // If you don't have Activity model, return mock data for now
    const mockActivity = [
      { type: "event", message: "New event submitted: Grammy Awards 2025", status: "pending", timestamp: new Date() },
      { type: "payout", message: "Payout requested: GHS 5,200", status: "pending", timestamp: new Date(Date.now() - 3600000) },
      { type: "user", message: "New organizer registered: John Doe", status: "approved", timestamp: new Date(Date.now() - 7200000) }
    ];

    res.json({ activity: mockActivity });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

// backend/routes/admin.js

// GET: /api/admin/users
router.get("/users", protect, isAdmin, async (req, res) => {
    const users = await User.find().select("name email phone role isOrganizer isBanned createdAt");
    res.json({ users });
  });
  
  // PUT: /api/admin/users/:id/role
  router.put("/users/:id/role", protect, isAdmin, async (req, res) => {
    const { role } = req.body;
    const updates = {};
    if (role === "admin") updates.role = "admin";
    else if (role === "organizer") updates.isOrganizer = true, updates.role = "user";
    else updates.isOrganizer = false, updates.role = "user";
  
    await User.findByIdAndUpdate(req.params.id, updates);
    res.json({ success: true });
  });
  
  // PUT: /api/admin/users/:id/ban
  router.put("/users/:id/ban", protect, isAdmin, async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isBanned: req.body.isBanned });
    res.json({ success: true });
  });

// backend/routes/admin.js

// GET: /api/admin/events
router.get("/events", protect, isAdmin, async (req, res) => {
    const events = await Event.find()
      .populate("organizer", "name email")
      .select("title banner date venue description status ticketsSold revenue ticketTypes");
    res.json({ events });
  });
  
  // PUT: /api/admin/events/:id/status
  router.put("/events/:id/status", protect, isAdmin, async (req, res) => {
    const { status } = req.body;
    await Event.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  });

// backend/routes/admin.js

// GET: /api/admin/organizers
router.get("/organizers", protect, isAdmin, async (req, res) => {
    const organizers = await User.find({ isOrganizer: true })
      .select("name email createdAt isApproved")
      .lean();
  
    const enriched = await Promise.all(
      organizers.map(async (org) => {
        const events = await Event.find({ organizer: org._id });
        const totalEvents = events.length;
        const totalTickets = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);
        const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  
        return {
          ...org,
          totalEvents,
          totalTickets,
          totalRevenue,
          events: events.map(e => ({ _id: e._id, title: e.title, date: e.date, status: e.status }))
        };
      })
    );
  
    res.json({ organizers: enriched });
  });
  
  // PUT: /api/admin/organizers/:id/approval
  router.put("/organizers/:id/approval", protect, isAdmin, async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved });
    res.json({ success: true });
  });

// backend/routes/admin.js

// GET: /api/admin/affiliates
router.get("/affiliates", protect, isAdmin, async (req, res) => {
    const affiliates = await User.find({ referralCode: { $exists: true } })
      .select("name email referralCode referrals earned paidOut")
      .lean();
  
    const enriched = affiliates.map(aff => ({
      ...aff,
      referrals: aff.referrals?.length || 0,
      earned: aff.earned || 0,
      paidOut: aff.paidOut || 0,
      code: aff.referralCode
    }));
  
    res.json({ affiliates: enriched });
  });

// backend/routes/admin.js

// GET /api/admin/shop/products
router.get("/shop/products", protect, isAdmin, async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  });
  
  // POST /api/admin/shop/products
  router.post("/shop/products", protect, isAdmin, async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  });
  
  // PUT /api/admin/shop/products/:id
  router.put("/shop/products/:id", protect, isAdmin, async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  });
  
  // DELETE /api/admin/shop/products/:id
  router.delete("/shop/products/:id", protect, isAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });
  
  // GET /api/admin/shop/stats
  router.get("/shop/stats", protect, isAdmin, async (req, res) => {
    const [products, orders] = await Promise.all([
      Product.find(),
      Order.find().populate("items.product")
    ]);
  
    const totalProducts = products.length;
    const inStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  
    res.json({ totalProducts, totalOrders, revenue, inStock });
  });

// backend/routes/admin.js

// GET /api/admin/finances
router.get("/finances", protect, isAdmin, async (req, res) => {
    const range = req.query.range || "all";
    const now = new Date();
    let startDate;
  
    if (range === "week") startDate = new Date(now.setDate(now.getDate() - 7));
    else if (range === "month") startDate = new Date(now.setMonth(now.getMonth() - 1));
    else if (range === "year") startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    else startDate = new Date(0);
  
    const tickets = await Ticket.find({ createdAt: { $gte: startDate } });
    const payouts = await Payout.find({ createdAt: { $gte: startDate } });
  
    const totalRevenue = tickets.reduce((sum, t) => sum + t.price, 0);
    const platformFees = totalRevenue * 0.10;
    const organizerPayouts = payouts.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
    const netProfit = platformFees - organizerPayouts;
    const pendingPayouts = payouts.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  
    // Monthly aggregation
    const monthly = {};
    [...tickets, ...payouts].forEach(item => {
      const month = new Date(item.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthly[month]) monthly[month] = { revenue: 0, fees: 0, payouts: 0, profit: 0 };
      
      if (item instanceof Ticket) {
        monthly[month].revenue += item.price;
        monthly[month].fees += item.price * 0.10;
      } else if (item.status === "paid") {
        monthly[month].payouts += item.amount;
      }
    });
  
    Object.keys(monthly).forEach(m => {
      monthly[m].profit = monthly[m].fees - monthly[m].payouts;
    });
  
    const monthlyData = Object.keys(monthly).map(m => ({
      month: m,
      revenue: monthly[m].revenue,
      fees: monthly[m].fees,
      payouts: monthly[m].payouts,
      profit: monthly[m].profit
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  
    const recentTransactions = [
      ...tickets.map(t => ({ date: t.createdAt, type: "revenue", description: `Ticket: ${t.event.title}`, amount: t.price })),
      ...payouts.map(p => ({ date: p.createdAt, type: p.status === "paid" ? "payout" : "pending", description: `Payout to ${p.organizer.name}`, amount: p.amount }))
    ].sort((a, b) => b.date - a.date).slice(0, 10);
  
    res.json({
      totalRevenue,
      platformFees,
      organizerPayouts,
      netProfit,
      pendingPayouts,
      monthlyData,
      recentTransactions
    });
  });

// backend/routes/admin.js

// GET /api/admin/settings
router.get("/settings", protect, isAdmin, async (req, res) => {
    const settings = await Settings.findOne() || {
      siteName: "Premium Events",
      siteUrl: "https://premium-events.com",
      primaryColor: "#8b5cf6",
      platformFee: 10,
      emailFrom: "no-reply@premium-events.com",
      enable2FA: true,
      maintenanceMode: false
    };
    res.json(settings);
  });
  
  // PUT /api/admin/settings
  router.put("/settings", protect, isAdmin, async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  });