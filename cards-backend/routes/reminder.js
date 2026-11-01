const express = require('express');
const reminder = require('../controllers/reminderController');
const { requireAuth, requireSelf } = require('../middleware/auth');


const router = express.Router();


//router.post('/', remind.);
//router.get('/:userId', requireAuth, requireSelf, users.getUser);

module.exports = router;