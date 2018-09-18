const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// GET all work profiles
router.get('/', function (req, res) {
    return new Promise((resolve, reject) => {
        query('SELECT * FROM work', function (err, result) {
            if (err) {
                return console.error('error running query', err)
            }
            res.send({ work: result.rows });
        });
    });
});

// GET work information
router.get('/:id', function (req, res, ) {
    query('SELECT * FROM work WHERE id=$1', [req.params.id], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ work: result.rows });
    });
});