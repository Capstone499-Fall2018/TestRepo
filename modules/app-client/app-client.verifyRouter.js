const express = require('express');
const router = express.Router();
const verifyPin = require('./app-client.verify');

module.exports = router;

router.put('/pin',verifyPin.verifyClientPin);
router.put('/iris',verifyPin.verifyIris);