const User = require('../models/User');
const { createToken } = require('../middleware/auth');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// POST /api/users
exports.createUser = async (req, res, next) => {
  let user;

  try {
    const { firstName = '', lastName = '', email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    if (await User.exists({ email: String(email).trim().toLowerCase() })) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    // Only these fields are read from the body, so a client can't mark
    // itself verified. New accounts start with isVerified: false.
    user = new User({
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email)
    });

    await user.setPassword(String(password));

    // generates email verification token
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyToken = hashToken(token);

    await user.save();

    await sendVerificationEmail(user.email, token);
    
    return res.status(201).json({
      message: 'Account created. Check your email to verify your account.'
    });
  } catch (err) {
    // Avoid leaving an account that cannot receive its verification email.
    if (user?._id) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
    }
    next(err);
  }
};

// GET /api/users/:userId
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users.:userId
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User account deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
