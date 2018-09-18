const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { query } = require('../db/db-module');
const { findMatch } = require('../config/matchingService');
const crypto = require('crypto');
const PORTAL_SECRET = 'portal_jwt_secret';
const APP_SECRET = 'your_jwt_secret';

router.post('/login', passport.authenticate('local', { session: false }), function (req, res) {
    //get user profile from the passport middleware
    var user = req.user;

    // generate a signed json web token with the contents of user object and return it in the response
    const token = generateToken(user);
    console.log({ user, token });
    return res.json({ user, token });
});

router.post('/register', function (req, res) {
    //email verification
    if (req.body.email.includes(" ") || !(req.body.email.includes("@")) || !(req.body.email.includes(".com"))) {
        return res.json({
            errors: ['Your email did not meet the requirements, try again.']
        });
    }
    else {
        var verifiedEmail = req.body.email;
    }

    //password verification
    if (req.body.password.includes(" ") || req.body.password.length < 3 || req.body.password.length > 18) {
        return res.json({
            errors: ['Your password did not meet the requirements, try again.']
        });
    }
    else {
        var salt = crypto.randomBytes(16).toString('hex');
        var hashedPassword = crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, 'SHA512').toString('hex');
    }

    var sql = 'INSERT INTO users (email, username, password, salt) VALUES ($1,$2,$3,$4) RETURNING id';

    //Insert data from the POST body
    var data = [
        verifiedEmail,
        verifiedEmail,
        hashedPassword,
        salt
    ];

    //creates user profile in the database
    query(sql, data, function (err, result) {
        if (err) {
            // We hide our clients from internal errors, but log them
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Failed to create user profile']
            });
        }

        var newUserId = result.rows[0].id;
        var sqlSelect = 'SELECT * FROM users WHERE id = $1';
        query(sqlSelect, [newUserId], function (err, result) {
            if (err) {
                // We shield our clients from internal errors, but log them
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Could not retrieve user after create']
                });
            }
            // The request created a new resource object
            res.send(result.rows[0]);
            res.statusCode = 201;
        });

    });
});

//function to generate a profile-specific token with a 7 day lifespan
function generateToken(user) {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign({
        id: user.id,
        email: user.email,
        exp: parseInt(expiry.getTime() / 1000)
    }, PORTAL_SECRET);
}


module.exports = router;