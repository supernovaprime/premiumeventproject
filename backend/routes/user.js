// backend/routes/user.js
router.get("/tickets", protect, async (req, res) => {
    const tickets = await Ticket.find({ user: req.user.id });
    res.json({ count: tickets.length, tickets });
  });
  
  router.get("/orders", protect, async (req, res) => {
    const orders = await Order.find({ user: req.user.id });
    res.json({ count: orders.length, orders });
  });
  
  router.get("/votes", protect, async (req, res) => {
    const votes = await Vote.find({ user: req.user.id });
    res.json({ count: votes.length, votes });
  });
  
  router.get("/activity", protect, async (req, res) => {
    const activities = await Activity.find({ user: req.user.id }).sort({ date: -1 });
    res.json({ activities });
  });

// backend/routes/user.js
router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    req.user.avatar = avatarUrl;
    await req.user.save();
    res.json({ avatar: avatarUrl });
  });
  
  router.put("/profile", protect, async (req, res) => {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ user });
  });


// backend/routes/user.js
router.get("/votes", protect, async (req, res) => {
    const votes = await Vote.find({ user: req.user.id })
      .populate({
        path: "event",
        select: "title date time venue banner"
      })
      .populate({
        path: "nominee",
        select: "name image"
      })
      .populate({
        path: "category",
        select: "name"
      })
      .sort({ createdAt: -1 });
  
    res.json({ votes });
  });