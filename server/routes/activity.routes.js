const express = require('express');
const router = express.Router();
const { getActivity } = require('../controllers/activity.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', getActivity);

module.exports = router;
