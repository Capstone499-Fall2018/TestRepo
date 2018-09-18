const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// GET all cccif profiles
router.get('/', function (req, res) {
    query('SELECT * FROM cccif', function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ cccif: result.rows });
    });
});

// GET a cccif profile by id
router.get('/:id', function (req, res, ) {
    query('SELECT * FROM cccif WHERE id=$1', [req.params.id], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ cccif: result.rows });
    });
});