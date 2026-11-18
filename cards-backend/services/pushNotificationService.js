
const PushSubscription = require('../models/PushSubscription');
const { webPush } = require('../config/push');

/**
 * Send a push notification for one reminder.
 *
 * Only subscriptions belonging to reminder.userId are queried.
 */
async function sendReminderNotification(reminder, { fiveMinutesBefore = false } = {}) {
  if (!reminder || !reminder.userId || !reminder._id) {
    throw new Error('A valid reminder is required.');
  }

  // Never broadcast to every subscription.
  const subscriptions = await PushSubscription.find({
    userId: reminder.userId
  });

  if (subscriptions.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      noSubscriptions: true
    };
  }

  const reminderId = reminder._id.toString();

  const payload = JSON.stringify({
    title: fiveMinutesBefore ? 'Reminder in 5 minutes' : 'Reminder due now',
    body: `${reminder.title}`,
    data: {
      reminderId,
      url: `/dashboard?reminderId=${reminderId}`,
      fiveMinutesBefore
    }
  });

  let successCount = 0;
  let failureCount = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };

      try {
        const response = await webPush.sendNotification(
          pushSubscription,
          payload,
          {
            TTL: 60 * 60
          }
        );

        successCount++;

        return {
          success: true,
          subscriptionId: subscription._id,
          statusCode: response.statusCode
        };
      } catch (error) {
        failureCount++;

        const statusCode = error.statusCode;

        // 404 and 410 mean the subscription is no longer valid.
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({
            _id: subscription._id,
            userId: reminder.userId
          });

          console.log(
            `[Push] Removed expired subscription ${subscription._id}`
          );

          return {
            success: false,
            removed: true,
            statusCode
          };
        }

        console.error(
          `[Push] Failed to send to subscription ${subscription._id}:`,
          statusCode || error.message
        );

        return {
          success: false,
          statusCode: statusCode || null,
          message: error.message
        };
      }
    })
  );

  console.log(
    `[Push] Reminder ${reminderId}: ${successCount} successful, ${failureCount} failed.`
  );

  return {
    successCount,
    failureCount,
    noSubscriptions: false,
    results
  };
}

module.exports = {
  sendReminderNotification
};
