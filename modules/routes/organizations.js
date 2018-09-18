const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// GET all organizations
router.get('/', function (req, res) {
    query('SELECT * FROM organization', function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ organization: result.rows });
    });
});

// GET organization 
router.get('/:id', function (req, res, ) {
    query('SELECT * FROM organization WHERE id=$1', [req.params.id], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ organization: result.rows });
    });
});
