const crypto = require('crypto');

// Event and reminder titles and notes are encrypted (AES-256-GCM) before they
// are written to the database. Every server sharing a database needs the same
// key; losing or changing it makes the stored text unreadable.
const KEY = Buffer.from(process.env.DB_ENCRYPTION_KEY || '', 'hex');

if (KEY.length !== 32) {
  throw new Error(
    'DB_ENCRYPTION_KEY must be 64 hex characters. Add it to your .env file (see .env.example).'
  );
}

const PREFIX = 'enc:';

// Stored as enc:<iv>:<auth tag>:<ciphertext>, each part base64
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join(':');
}

function decrypt(value) {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value;
  const [iv, tag, data] = value.slice(PREFIX.length).split(':').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// Schema type for a String field stored encrypted. The setter encrypts on
// save and update; the getter decrypts when the document is sent as JSON.
// Encrypted fields can't be searched or sorted in queries, and .lean()
// skips getters, so don't use .lean() on models with these fields.
const encryptedString = (maxLength) => ({
  type: String,
  default: '',
  set: (v) => encrypt(v == null ? v : String(v).trim()),
  get: decrypt,
  validate: {
    validator: (v) => (decrypt(v) || '').length <= maxLength,
    message: `{PATH} must be at most ${maxLength} characters`
  }
});

module.exports = { encrypt, decrypt, encryptedString };
