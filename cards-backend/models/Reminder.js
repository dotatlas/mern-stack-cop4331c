const mongoose = require('mongoose');
const { encryptedString } = require('../config/encryption');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required']
    },
    title: {
      ...encryptedString(200),
      required: [true, 'Title is required']
    },
    notes: encryptedString(2000),
    // Optional: reminders with a due date also show on the calendar
    dueAt: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'reminders',
    versionKey: false,
    id: false,
    toJSON: { getters: true }
  }
);

// The reminders list and the calendar feed both load one user's reminders by due date
reminderSchema.index({ userId: 1, dueAt: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
