const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const Event = require('../models/Event');

// Check that an ID is a valid MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id) &&
  /^[0-9a-fA-F]{24}$/.test(id);

// Check that a date is valid
const isValidDate = (value) => {
  return !Number.isNaN(new Date(value).getTime());
};

const validPriorities = ['low', 'medium', 'high'];


// CREATE REMINDER
// POST /api/reminders
exports.createReminder = async (req, res) => {
  try {
    const { title, notes, dueAt, priority, eventId } = req.body;

    // Title is required
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate notes
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string' });
    }

    // Validate due date if provided
    if (dueAt !== undefined && dueAt !== null && !isValidDate(dueAt)) {
      return res.status(400).json({ error: 'Invalid due date' });
    }

    // Validate priority if provided
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Priority must be low, medium, or high'
      });
    }

    // If an event was selected, make sure it belongs to this user
    if (eventId !== undefined && eventId !== null) {
      if (!isValidId(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const event = await Event.findOne({
        _id: eventId,
        userId: req.userId
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
    }

    const reminder = await Reminder.create({
      userId: req.userId,
      title: title.trim(),
      notes,
      dueAt: dueAt ?? null,
      priority: priority ?? 'medium',
      eventId: eventId ?? null
    });

    return res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    return res.status(500).json({ error: 'Server error creating reminder' });
  }
};


// GET ALL REMINDERS
// GET /api/reminders
// GET ALL REMINDERS WITH FILTERING
// GET /api/reminders
exports.getReminders = async (req, res) => {
  try {
    const {
      priority,
      completed,
      from,
      to,
      eventId,
      noDueDate
    } = req.query;

    // Always restrict results to the logged-in user
    const filter = {
      userId: req.userId
    };

    // Filter by priority
    if (priority !== undefined) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: 'Priority must be low, medium, or high'
        });
      }

      filter.priority = priority;
    }

    // Filter by completion status
    if (completed !== undefined) {
      if (!['true', 'false'].includes(completed)) {
        return res.status(400).json({
          error: 'Completed must be true or false'
        });
      }

      filter.completed = completed === 'true';
    }

    // Filter by event
    if (eventId !== undefined) {
      if (!isValidId(eventId)) {
        return res.status(400).json({
          error: 'Invalid event ID'
        });
      }

      const event = await Event.findOne({
        _id: eventId,
        userId: req.userId
      });

      if (!event) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }

      filter.eventId = eventId;
    }

    // Filter reminders without a due date
    if (noDueDate !== undefined) {
      if (!['true', 'false'].includes(noDueDate)) {
        return res.status(400).json({
          error: 'noDueDate must be true or false'
        });
      }

      filter.dueAt = noDueDate === 'true'
        ? null
        : { $ne: null };
    }

    // Filter by due date range
    if (from !== undefined || to !== undefined) {
      if (noDueDate === 'true') {
        return res.status(400).json({
          error: 'Cannot combine noDueDate=true with a date range'
        });
      }

      if (from !== undefined && !isValidDate(from)) {
        return res.status(400).json({ error: 'Invalid from date' });
      }

      if (to !== undefined && !isValidDate(to)) {
        return res.status(400).json({ error: 'Invalid to date' });
      }

      const dateFilter = {};

      if (from !== undefined) {
        dateFilter.$gte = new Date(from);
      }

      if (to !== undefined) {
        dateFilter.$lt = new Date(to);
      }

      if (
        from !== undefined &&
        to !== undefined &&
        new Date(from) >= new Date(to)
      ) {
        return res.status(400).json({
          error: 'From date must be before to date'
        });
      }

      filter.dueAt = dateFilter;
    }

    const reminders = await Reminder.find(filter).sort({
      dueAt: 1,
      _id: 1
    });

    return res.status(200).json(reminders);

  } catch (error) {
    console.error('Get reminders error:', error);

    return res.status(500).json({
      error: 'Server error retrieving reminders'
    });
  }
};

// GET ONE REMINDER
// GET /api/reminders/:id
exports.getReminderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid reminder ID' });
    }

    const reminder = await Reminder.findOne({
      _id: id,
      userId: req.userId
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.status(200).json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    return res.status(500).json({ error: 'Server error retrieving reminder' });
  }
};


// UPDATE REMINDER
// PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid reminder ID' });
    }

    // Only these fields can be updated through this endpoint
    const allowedFields = [
      'title',
      'notes',
      'dueAt',
      'priority',
      'eventId'
    ];

    const updates = {};

    // Copy only fields the user is allowed to update
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    // Validate title
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || !updates.title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }

      updates.title = updates.title.trim();
    }

    // Validate notes
    if (
      updates.notes !== undefined &&
      updates.notes !== null &&
      typeof updates.notes !== 'string'
    ) {
      return res.status(400).json({ error: 'Notes must be a string' });
    }

    // Validate due date. Null clears the due date.
    if (
      updates.dueAt !== undefined &&
      updates.dueAt !== null &&
      !isValidDate(updates.dueAt)
    ) {
      return res.status(400).json({ error: 'Invalid due date' });
    }

    // Validate priority
    if (
      updates.priority !== undefined &&
      !validPriorities.includes(updates.priority)
    ) {
      return res.status(400).json({
        error: 'Priority must be low, medium, or high'
      });
    }

    // Validate event link. Null removes the event association.
    if (updates.eventId !== undefined && updates.eventId !== null) {
      if (!isValidId(updates.eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const event = await Event.findOne({
        _id: updates.eventId,
        userId: req.userId
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
    }

    const reminder = await Reminder.findOneAndUpdate(
      {
        _id: id,
        userId: req.userId
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.status(200).json(reminder);
  } catch (error) {
    console.error('Update reminder error:', error);
    return res.status(500).json({ error: 'Server error updating reminder' });
  }
};


// DELETE REMINDER
// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid reminder ID' });
    }

    const reminder = await Reminder.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.status(200).json({
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    return res.status(500).json({ error: 'Server error deleting reminder' });
  }
};


// MARK REMINDER COMPLETE / INCOMPLETE
// PATCH /api/reminders/:id/complete
exports.toggleReminderComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid reminder ID' });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'Completed must be true or false'
      });
    }

    const reminder = await Reminder.findOneAndUpdate(
      {
        _id: id,
        userId: req.userId
      },
      { $set: { completed } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.status(200).json(reminder);
  } catch (error) {
    console.error('Toggle reminder error:', error);
    return res.status(500).json({ error: 'Server error updating reminder status' });
  }
};