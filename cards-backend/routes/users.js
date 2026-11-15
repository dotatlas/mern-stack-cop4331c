const express = require('express');
const {
  createUser,
  getUser,
  deleteUser
} = require('../controllers/usersController');
const validateObjectId = require('../middleware/validateObjectId');
const { requireAuth, requireSelf } = require('../middleware/auth');

const router = express.Router();

// Runs before any route below that contains :userId
router.param('userId', validateObjectId);

// POST /api/users - Register a new user (open to everyone)
router.post('/', createUser);  

// Everything below needs a logged-in user, and only their own account
// GET /api/users/:userId - Fetch one user
router.get('/:userId', requireAuth, requireSelf, getUser);

router.delete('/:userId', deleteUser);

module.exports = router;
