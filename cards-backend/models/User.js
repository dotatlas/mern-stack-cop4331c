const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// How much work bcrypt does per hash. Each +1 doubles the time it takes,
// which is what makes stolen hashes slow to crack. 10 is a common default.
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is not valid']
    },
    // Set with user.setPassword(); never holds the plain password.
    // Hidden from query results unless asked for with .select('+passwordHash').
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    // Tokens for the email verification and password reset links
    verifyToken: {
      type: String,
      select: false
    },
    resetToken: {
      type: String,
      select: false
    },
    resetExpires: {
      type: Date,
      select: false
    }
  },
  {
    collection: 'users',
    versionKey: false
  }
);

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a login attempt against the stored hash.
// Only works on a document loaded with .select('+passwordHash').
userSchema.methods.checkPassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Remove secrets whenever a user document is sent as JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.verifyToken;
    delete ret.resetToken;
    delete ret.resetExpires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
