const mongoose = require('mongoose');
const { encryptedString } = require('../config/encryption');

const eventSchema = new mongoose.Schema(
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
    start: {
      type: Date,
      required: [true, 'Start time is required']
    },
    end: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (end) {
          return !this.start || end >= this.start;
        },
        message: 'End time must not be before the start time'
      }
    },
    allDay: {
      type: Boolean,
      default: false
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    notes: encryptedString(2000),
    color: {
      type: String,
      default: '#007AFF',
      match: [/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #007AFF']
    }
  },
  {
    collection: 'events',
    versionKey: false,
    id: false,
    toJSON: { getters: true }
  }
);

// Calendar views load one user's events within a date range
eventSchema.index({ userId: 1, start: 1 });

module.exports = mongoose.model('Event', eventSchema);
