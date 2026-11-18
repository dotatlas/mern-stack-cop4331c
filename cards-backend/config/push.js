const webPush = require('web-push');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  throw new Error('Missing VAPID environment variables');
}

// Configure the application to authenticate with browser push services.
webPush.setVapidDetails(
  subject,
  publicKey,
  privateKey
);

module.exports = {
  webPush,
  publicKey,
};