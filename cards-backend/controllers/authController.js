const { User } = require('../models');
const { createToken } = require('../middleware/auth');

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // String() matters: without it, a body like {"email": {"$ne": null}}
    // becomes a MongoDB operator instead of an email address.
    // The password hash is hidden by default (select: false), so ask for it.
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+passwordHash');

    // Same message whether the email or the password was wrong, so the
    // response doesn't reveal which accounts exist.
    if (!user || !(await user.checkPassword(String(password)))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ token: createToken(user), user });
  } catch (err) {
    next(err);
  }
};
