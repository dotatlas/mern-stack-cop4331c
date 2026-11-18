const express = require('express');
const router = express.Router();

const PushSubscription = require('../models/PushSubscription');
const { requireAuth } = require('../middleware/auth');
const { publicKey } = require('../config/push');

router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const subscriptions = await PushSubscription.countDocuments({ userId: req.userId });
    return res.status(200).json({ enabled: subscriptions > 0 });
  } catch (error) {
    next(error);
  }
});

// GET /api/push/public-key
// React needs the public VAPID key to subscribe.
router.get('/public-key', (req, res) => {
  res.status(200).json({
    publicKey,
  });
});

// POST /api/push/subscribe
// Save a browser subscription for the authenticated user.
//in the frontend it whenUser clicks Enable Notifications.
router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const subscription = req.body;

    // Validate the subscription received from the browser.
    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== 'string' ||
      typeof subscription.keys.auth !== 'string'
    ) {
      return res.status(400).json({
        error: 'Invalid push subscription',
      });
    }

    // Browser push service endpoints should use HTTPS.
    let endpointUrl;

    try {
      endpointUrl = new URL(subscription.endpoint);
    } catch {
      return res.status(400).json({
        error: 'Invalid subscription endpoint',
      });
    }

    if (endpointUrl.protocol !== 'https:') {
      return res.status(400).json({
        error: 'Subscription endpoint must use HTTPS',
      });
    }

    // Associate the subscription with the authenticated user.
    // If this endpoint already exists, update it instead of
    // creating a duplicate.
    const savedSubscription =
      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          $set: {
            userId: req.userId,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
            expirationTime: subscription.expirationTime ?? null,
            userAgent: req.get('User-Agent') || null,
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      message: 'Push subscription saved successfully',
      subscriptionId: savedSubscription._id,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/push/unsubscribe
// Remove a subscription belonging to the authenticated user.
router.delete('/unsubscribe', requireAuth, async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({
        error: 'Subscription endpoint is required',
      });
    }

    const deleted = await PushSubscription.findOneAndDelete({
      endpoint,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        error: 'Subscription not found',
      });
    }

    return res.status(200).json({
      message: 'Push subscription removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
