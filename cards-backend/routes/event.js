const express = require('express');

const { requireAuth } = require("../middleware/auth");
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require("../controllers/eventController");

const router = express.Router();

// POST /api/events
router.post("/", requireAuth, createEvent);
// POST /api/events
router.post("/", requireAuth, createEvent);

// GET /api/events?from=&to=
router.get("/", requireAuth,  getEvents);

// GET /api/events/:id
router.get("/:id", requireAuth,  getEventById);

// PUT /api/events/:id
router.put("/:id", requireAuth, updateEvent);

// DELETE /api/events/:id
router.delete("/:id",requireAuth, deleteEvent);

module.exports = router;