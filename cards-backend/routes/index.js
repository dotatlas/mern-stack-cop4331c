const express = require('express');

const router = express.Router();

// GET /api/ping - Health check
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Hello World' });
});

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/events', require('./event'));
router.use('/push', require('./push'));
router.use('/reminders', require('./reminder'));

module.exports = router;
