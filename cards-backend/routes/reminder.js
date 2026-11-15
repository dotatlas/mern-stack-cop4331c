const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');

const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  toggleReminderComplete
} = require('../controllers/reminderController');

// Every reminder route requires a valid login
router.use(requireAuth);

// Create a reminder
router.post('/', createReminder);

// Get all reminders
router.get('/', getReminders);

// Mark a reminder complete or incomplete
router.patch('/:id/complete', toggleReminderComplete);

// Get, update, or delete one reminder
router.get('/:id', getReminderById);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;