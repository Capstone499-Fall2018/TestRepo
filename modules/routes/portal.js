const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');

module.exports = router;

// GET all users
router.get('/', function (req, res) {
  query('SELECT * FROM users', function (err, result) {
    if (err) {
      return console.error('error running query', err)
    }
    res.send({ users: result.rows });
  });
});

// GET user profile by id
router.get('/:id', function (req, res) {
  query('SELECT * FROM users WHERE id=$1', [req.params.id], function (err, result) {
    if (err) {
      return console.error('error running query', err)
    }
    res.send({ user: result.rows });
  });
});

//Edit full User profile by id
//For when changing multiple parts of a user account, fields will pre-populate and will be editable
router.post('/:id/edit', function (req, res) {
  query("UPDATE users SET email=$1, username=$2, password=$3 WHERE id=$4",
    [req.body.email, req.body.username, req.body.password, req.params.id]);
});

//Edit one piece (password) of user profile by id
router.put('/:id/edit', function (req, res) {
  query("UPDATE users SET password=$1 WHERE id=$2",
    [req.body.password, req.params.id]);
});

//Delete user profile by id
router.delete('/:id/delete', function (req, res) {
  query("DELETE FROM users WHERE id = $1", [req.params.id]);
  res.send(200);
});