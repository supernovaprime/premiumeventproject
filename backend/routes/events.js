// backend/routes/events.js
router.put("/:id", protect, isOrganizer, upload.single("banner"), async (req, res) => {
    const updates = req.body;
    if (req.file) updates.banner = `/uploads/${req.file.filename}`;
  
    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ event });
  });

  import validateObjectId from "../middleware/validateObjectId.js";

  // Example
  router.get("/:id", validateObjectId, getEventById);
  router.put("/:id", validateObjectId, updateEvent);
  router.delete("/:id", validateObjectId, deleteEvent);
