const { User } = require('../models');
const { createToken } = require('../middleware/auth');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// reusable helper: hashes a token using SHA-256
const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// normalize emails consistently
const normalizeEmail = (email) => {
  return String(email).trim().toLowerCase();
};

// basic email format validation
const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};



// POST /api/auth/register     
//creates an unverifed account and sends email
//changes this so the create user now sned the email verfication instead
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body || {};

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // 2. Normalize email
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please enter a valid email address'
      });
    }

    //password must be at least 8 characters
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    // 3. Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'An account with that email already exists'
      });
    }

    // 4. Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);

    // 5. Create new user
    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      verifyToken: hashedToken,
      isVerified: false
    });

    // 6. Hash password
    await user.setPassword(String(password));

    // 7. Save user to MongoDB
    await user.save();

    let emailSent = false
    // 8. Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, token);
      emailSent = true;
    } catch (emailError) {
      console.error('Verification email failed:', emailError.message);
      return res.status(503).json({
        error: 'Account created, but verification email could not be sent. Please try resending it.'
      });
    }

    // 9. Respond to frontend
    return res.status(201).json({
      message: emailSent
        ? 'Account created! Please check your email to verify your account.'
        : 'Account created, but the verification email could not be sent. Please try resending it.',
      emailSent
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
//checks cred and verifys status
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // String() matters: without it, a body like {"email": {"$ne": null}}
    // becomes a MongoDB operator instead of an email address.
    // The password hash is hidden by default (select: false), so ask for it.
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');

    // Same message whether the email or the password was wrong, so the
    // response doesn't reveal which accounts exist.
    if (!user || !(await user.checkPassword(String(password)))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Prevent unverified users from logging in
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in'
      });
    }

    res.status(200).json({ token: createToken(user), user });
  } catch (err) {
    next(err);
  }
};

// GET /verify/:token
//verifies user email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }

    // Hash the token received from the email
    const hashedToken = hashToken(token);

    // Find user with matching stored token
    const user = await User.findOne({
      verifyToken: hashedToken
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or already used verification link'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: 'Email is already verified'
      });
    }

    // Mark account as verified
    user.isVerified = true;

    // Clear token so it cannot be reused
    user.verifyToken = undefined;

    await user.save();

    return res.status(200).json({
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (err) {
    next(err);
  }
};


//POST /resend-verification
//sends another verifcation email
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Look for an account that still needs verification
    const user = await User.findOne({
      email: normalizedEmail,
      isVerified: false
    });

    // Same response whether the account exists or not
    const message =
      'If an unverified account exists, a verification email has been sent.';

    if (!user) {
      return res.status(200).json({ message });
    }

    // Generate a fresh token
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyToken = hashToken(token);

    await user.save();

    try {
      await sendVerificationEmail(normalizedEmail, token);
    } catch (emailError) {
      console.error('Resend verification failed:', emailError.message);
    }

    return res.status(200).json({ message });

  } catch (err) {
    next(err);
  }
};


//POST /forgot-password
//generates and emails a password reset token
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Find account
    const user = await User.findOne({
      email: normalizedEmail
    });

    // Always return the same response to avoid revealing accounts
    const message =
      'If an account exists with that email, a password reset link has been sent.';

    if (!user) {
      return res.status(200).json({ message });
    }

    // Generate password reset token
    const token = crypto.randomBytes(32).toString('hex');

    user.resetToken = hashToken(token);

    // Reset link expires after one hour
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    try {
      await sendPasswordResetEmail(normalizedEmail, token);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError.message);
    }

    return res.status(200).json({ message });

  } catch (err) {
    next(err);
  }
};


//POST /reset-password
//changes the passwording using the token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};

    if (
      typeof token !== 'string' ||
      !token ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    // Hash the token received from the frontend
    const hashedToken = hashToken(token);

    // Find account with matching token that has not expired
    const user = await User.findOne({
      resetToken: hashedToken,
      resetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired password reset link'
      });
    }

    // Hash and update new password
    await user.setPassword(password);

    // Clear reset token so it cannot be reused
    user.resetToken = null;
    user.resetExpires = null;

    await user.save();

    return res.status(200).json({
      message: 'Password reset successfully. You can now log in.'
    });

  } catch (err) {
    next(err);
  }
};