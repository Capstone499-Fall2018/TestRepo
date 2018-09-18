const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// Home route
router.get('/', function (req, res) {
    res.send('HELLO WORLD');
});

