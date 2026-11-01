const Event = require("../models/Event");
const mongoose = require('mongoose');


// POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const { title, start, end, allDay, location, notes, color } = req.body;

    // 1. Validate required fields
    if (!title || !start || !end) {
      return res.status(400).json({
        error: "Title, start, and end are required"
      });
    }

    // 2. Validate title
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "Title must be a non-empty string"
      });
    }

    // 3. Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Invalid start or end date"
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        error: "End date must be after or equal to start date"
      });
    }

    // 4. Validate optional fields
    if (allDay !== undefined && typeof allDay !== "boolean") {
      return res.status(400).json({
        error: "allDay must be a boolean"
      });
    }

    for (const field of ["location", "notes", "color"]) {
      if (req.body[field] !== undefined &&
          typeof req.body[field] !== "string") {
        return res.status(400).json({
          error: `${field} must be a string`
        });
      }
    }

    // 5. Create the event
    const event = await Event.create({
      userId: req.userId,
      title: title.trim(),
      start: startDate,
      end: endDate,
      allDay,
      location,
      notes,
      color
    });

    // 6. Return the created event
    return res.status(201).json({
      message: "Event created successfully",
      event
    });

  } catch (error) {
    console.error("Create event error:", error);

    return res.status(500).json({
      error: "Server error while creating event"
    });
  }
};

// GET /api/events?from=&to=
exports.getEvents = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Both from and to dates are required"
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) ||
        Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    if (fromDate >= toDate) {
      return res.status(400).json({
        error: "from must be earlier than to"
      });
    }

    const events = await Event.find({
      userId: req.userId,
      start: { $lt: toDate },
      end: { $gt: fromDate }
    }).sort({ start: 1 });

    return res.status(200).json({ events });

  } catch (error) {
    console.error("Get events error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/events/:id
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await Event.findOne({
      _id: id,
      userId: req.userId
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({ event });

  } catch (error) {
    console.error("Get event error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const allowedFields = [
      "title",
      "start",
      "end",
      "allDay",
      "location",
      "notes",
      "color"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No valid fields provided"
      });
    }

    if ("title" in updates) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        return res.status(400).json({ error: "Invalid title" });
      }

      updates.title = updates.title.trim();
    }

    if ("start" in updates) {
      updates.start = new Date(updates.start);

      if (Number.isNaN(updates.start.getTime())) {
        return res.status(400).json({ error: "Invalid start date" });
      }
    }

    if ("end" in updates) {
      updates.end = new Date(updates.end);

      if (Number.isNaN(updates.end.getTime())) {
        return res.status(400).json({ error: "Invalid end date" });
      }
    }

    if ("allDay" in updates && typeof updates.allDay !== "boolean") {
      return res.status(400).json({ error: "allDay must be a boolean" });
    }

    for (const field of ["location", "notes", "color"]) {
      if (field in updates && typeof updates[field] !== "string") {
        return res.status(400).json({
          error: `${field} must be a string`
        });
      }
    }

    // Check the final start/end combination, including unchanged values.
    const existingEvent = await Event.findOne({
      _id: id,
      userId: req.userId
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const finalStart = updates.start ?? existingEvent.start;
    const finalEnd = updates.end ?? existingEvent.end;

    if (finalEnd < finalStart) {
      return res.status(400).json({
        error: "End date must be after or equal to start date"
      });
    }

    const event = await Event.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Event updated successfully",
      event
    });

  } catch (error) {
    console.error("Update event error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await Event.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({
      message: "Event deleted successfully"
    });

  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};