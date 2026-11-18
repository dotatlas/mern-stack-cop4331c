
const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const {
  sendReminderNotification
} = require('./pushNotificationService');

const CHECK_INTERVAL = '*/1 * * * *';
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 100;

let schedulerTask = null;
let isChecking = false;

async function processDueReminders() {
  if (isChecking) {
    console.log('[Reminder Scheduler] Previous check still running.');
    return;
  }

  isChecking = true;

  try {
    const now = new Date();
    const expiredProcessingTime = new Date(
      now.getTime() - PROCESSING_TIMEOUT_MS
    );

    // Send the early alert once as a reminder enters the five-minute window.
    const fiveMinuteCandidates = await Reminder.find({
      dueAt: { $gt: now, $lte: new Date(now.getTime() + 5 * 60 * 1000) },
      completed: false,
      notificationFiveMinuteSentAt: null
    }).limit(BATCH_SIZE);

    for (const candidate of fiveMinuteCandidates) {
      const claimedAt = new Date();
      const reminder = await Reminder.findOneAndUpdate(
        {
          _id: candidate._id,
          dueAt: { $gt: claimedAt, $lte: new Date(claimedAt.getTime() + 5 * 60 * 1000) },
          completed: false,
          notificationFiveMinuteSentAt: null
        },
        { $set: { notificationFiveMinuteSentAt: claimedAt } },
        { returnDocument: 'after' }
      );

      if (!reminder) continue;
      try {
        const result = await sendReminderNotification(reminder, { fiveMinutesBefore: true });
        if (result.successCount === 0) {
          await Reminder.updateOne(
            { _id: reminder._id, notificationFiveMinuteSentAt: claimedAt },
            { $set: { notificationFiveMinuteSentAt: null } }
          );
          console.warn(`[Reminder Scheduler] Five-minute notification for ${reminder._id} was not delivered.`);
        }
      } catch (error) {
        await Reminder.updateOne(
          { _id: reminder._id, notificationFiveMinuteSentAt: claimedAt },
          { $set: { notificationFiveMinuteSentAt: null } }
        );
        console.error(`[Reminder Scheduler] Five-minute notification failed for ${reminder._id}:`, error);
      }
    }

    // Find due reminders eligible for processing.
    const candidates = await Reminder.find({
      dueAt: { $lte: now },
      completed: false,

      $and: [
        {
          $or: [
            { notificationAttempts: { $lt: MAX_ATTEMPTS } },
            { notificationAttempts: { $exists: false } }
          ]
        },
        {
          $or: [
            { notificationStatus: 'pending' },
            { notificationStatus: { $exists: false } },
            { notificationStatus: 'failed' },
            {
              notificationStatus: 'processing',
              notificationProcessingAt: {
                $lte: expiredProcessingTime
              }
            }
          ]
        }
      ]
    })
      .limit(BATCH_SIZE);

    if (candidates.length === 0) {
      console.log('[Reminder Scheduler] No due reminders.');
      return;
    }

    console.log(
      `[Reminder Scheduler] Found ${candidates.length} due reminder(s).`
    );

    for (const candidate of candidates) {
      const claimTime = new Date();

      const processingExpiredBefore = new Date(
        claimTime.getTime() - PROCESSING_TIMEOUT_MS
      );

      // Atomic claim prevents multiple scheduler instances from
      // processing the same reminder simultaneously.
      const reminder = await Reminder.findOneAndUpdate(
        {
          _id: candidate._id,
          dueAt: { $lte: claimTime },
          completed: false,

          $and: [
            {
              $or: [
                { notificationAttempts: { $lt: MAX_ATTEMPTS } },
                { notificationAttempts: { $exists: false } }
              ]
            },
            {
              $or: [
                { notificationStatus: 'pending' },
                { notificationStatus: { $exists: false } },
                { notificationStatus: 'failed' },
                {
                  notificationStatus: 'processing',
                  notificationProcessingAt: {
                    $lte: processingExpiredBefore
                  }
                }
              ]
            }
          ]
        },
        {
          $set: {
            notificationStatus: 'processing',
            notificationProcessingAt: claimTime
          },
          $inc: {
            notificationAttempts: 1
          }
        },
        {
          returnDocument: 'after',
          runValidators: true
        }
      );

      // Another execution may already have claimed this reminder.
      if (!reminder) {
        continue;
      }

      console.log(
        `[Reminder Scheduler] Processing reminder ${reminder._id}`
      );

      try {
        // Send to all devices belonging to this reminder's owner.
        const result = await sendReminderNotification(reminder);

        if (result.successCount > 0) {
          // At least one push service accepted the notification.
          await Reminder.updateOne(
            {
              _id: reminder._id,
              notificationStatus: 'processing'
            },
            {
              $set: {
                notificationStatus: 'sent',
                notificationSentAt: new Date(),
                notificationProcessingAt: null
              }
            }
          );

          console.log(
            `[Reminder Scheduler] Reminder ${reminder._id} marked sent.`
          );
        } else {
          // No device accepted the notification.
          const failureMessage = result.noSubscriptions
            ? 'No registered push subscriptions for this user.'
            : 'All push delivery attempts failed.';

          await Reminder.updateOne(
            {
              _id: reminder._id,
              notificationStatus: 'processing'
            },
            {
              $set: {
                notificationStatus: 'failed',
                notificationProcessingAt: null
              }
            }
          );

          console.warn(
            `[Reminder Scheduler] Reminder ${reminder._id} failed: ${failureMessage}`
          );
        }
      } catch (error) {
        console.error(
          `[Reminder Scheduler] Error sending reminder ${reminder._id}:`,
          error
        );

        await Reminder.updateOne(
          {
            _id: reminder._id,
            notificationStatus: 'processing'
          },
          {
            $set: {
              notificationStatus: 'failed',
              notificationProcessingAt: null
            }
          }
        );
      }
    }
  } catch (error) {
    console.error(
      '[Reminder Scheduler] Scheduler error:',
      error
    );
  } finally {
    isChecking = false;
  }
}

function startReminderScheduler() {
  if (schedulerTask) {
    console.log('[Reminder Scheduler] Already running.');
    return;
  }

  console.log('[Reminder Scheduler] Starting...');

  // Check once immediately on startup.
  processDueReminders();

  // Then check every minute.
  schedulerTask = cron.schedule(
    CHECK_INTERVAL,
    processDueReminders
  );

  console.log('[Reminder Scheduler] Running every 60 seconds.');
}

function stopReminderScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('[Reminder Scheduler] Stopped.');
  }
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  processDueReminders
};
