// backend/routes/eventRoutes.js
import express from "express";
import { body } from "express-validator";
import {
  getEvents,
  getEventById,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  getEventsByOrganizer,
  getEventAnalytics,
  getUpcomingEvents
} from "../controllers/eventController.js";

import validateObjectId from "../middleware/validateObjectId.js";
import protect, { authorize, canManageEvent } from "../middleware/auth.js"; // if you have authorize

const router = express.Router();

// Public routes
router.get("/", getEvents);
router.get("/upcoming", getUpcomingEvents);
router.get("/slug/:slug", getEventBySlug);
router.get("/organizer/:organizerId", validateObjectId, getEventsByOrganizer);
router.get("/:id", validateObjectId, getEventById);

// Protected routes
router.post("/", protect, authorize(['organizer', 'admin']), createEvent);

router.put("/:id", protect, canManageEvent, validateObjectId, updateEvent);
router.delete("/:id", protect, canManageEvent, validateObjectId, deleteEvent);

// Admin only
router.put("/:id/approve", protect, authorize(['admin']), validateObjectId, approveEvent);
router.put("/:id/reject", protect, authorize(['admin']), validateObjectId, rejectEvent);

// Organizer analytics
router.get("/:id/analytics", protect, canManageEvent, validateObjectId, getEventAnalytics);

export default router;