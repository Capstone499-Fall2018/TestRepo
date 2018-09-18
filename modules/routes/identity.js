const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// GET all identities
router.get('/', function (req, res) {
    query('SELECT * FROM identity', function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ identity: result.rows });
    });
});

// GET identity 
router.get('/:unid', function (req, res, ) {
    query('SELECT * FROM identity WHERE id=$1', [req.params.unid], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ identity: result.rows });
    });
});

// GET face 
router.get('/:unid/face', function (req, res, ) {
    query('SELECT * FROM face WHERE id=$1', [req.params.unid], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ face: result.rows });
    });
});

// GET finger 
router.get('/:unid/finger', function (req, res, ) {
    query('SELECT * FROM finger WHERE id=$1', [req.params.unid], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ finger: result.rows });
    });
});

// GET iris 
router.get('/:unid/iris', function (req, res, ) {
    query('SELECT * FROM iris WHERE id=$1', [req.params.unid], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ iris: result.rows });
    });
});