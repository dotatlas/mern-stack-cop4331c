const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    expirationTime: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'pushsubscriptions',
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model(
  'PushSubscription',
  pushSubscriptionSchema
);
