const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// GET all subjects
router.get('/', function (req, res) {
    query('SELECT * FROM subject', function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ subjects: result.rows });
    });
});

// GET subject 
router.get('/:id', function (req, res, ) {
    query('SELECT * FROM subject WHERE id=$1', [req.params.id], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ subject: result.rows });
    });
});
