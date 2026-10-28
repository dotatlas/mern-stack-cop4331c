const { User } = require('../models');
const { createToken } = require('../middleware/auth');

// POST /api/users
exports.createUser = async (req, res, next) => {
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
    const user = new User({
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email)
    });
    await user.setPassword(String(password));
    await user.save();

    // A new user is logged in right away, so the response includes a token.
    res
      .status(201)
      .location(`/api/users/${user._id}`)
      .json({ token: createToken(user), user });
  } catch (err) {
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
