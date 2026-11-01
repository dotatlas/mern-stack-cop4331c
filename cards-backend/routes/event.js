const express = require('express');
const event = require('../controllers/eventController');
const { requireAuth, requireSelf } = require('../middleware/auth');


const router = express.Router();


//router.post('/', event.);
//router.get('/:userId', requireAuth, requireSelf, users.getUser);

module.exports = router;