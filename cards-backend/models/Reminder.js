const mongoose = require('mongoose');
const { encryptedString } = require('../config/encryption');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },
    title: {
      ...encryptedString(200),
      required: [true, 'Title is required']
    },
    notes: encryptedString(2000),

    dueAt: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    // Notification tracking
    notificationStatus: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed'],
      default: 'pending',
      index: true
    },
    notificationSentAt: {
      type: Date,
      default: null
    },
    notificationFiveMinuteSentAt: {
      type: Date,
      default: null
    },
    // Used to recover reminders after a scheduler crash
    notificationProcessingAt: {
      type: Date,
      default: null
    },

    notificationAttempts: {
      type: Number,
      default: 0
    }
  },
  {
    collection: 'reminders',
    versionKey: false,
    id: false,
    toJSON: { getters: true }
  }
);

// Existing calendar/reminder query index
reminderSchema.index({ userId: 1, dueAt: 1 });

// Scheduler query index
reminderSchema.index({
  notificationStatus: 1,
  dueAt: 1,
  completed: 1
});

module.exports = mongoose.model('Reminder', reminderSchema);
