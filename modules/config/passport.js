const { query } = require('../db/db-module');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const crypto = require('crypto');
const jwt = require('jsonwebtoken')

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const KEY = 'super_secret_needs_to_come_from_settings'

module.exports = {
    extractJWTToRequest
}

//Strategy for verifying login credentials 
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
    function (email, password, done) {
        var sql = 'SELECT * FROM users WHERE email=$1';

        //grabs user profile from database if there is an email to match
        query(sql, [email])
            .then(function (result) {
                var dbHash = result.rows[0].password;

                //create user object from query result
                var user = {
                    "email": result.rows[0].email,
                    "password": result.rows[0].password,
                    "username": result.rows[0].username,
                    "id": result.rows[0].id
                }

                //creates a new hashed password from the plain text password given at login
                var newHash = crypto.pbkdf2Sync(password, result.rows[0].salt, 1000, 64, 'SHA512').toString('hex');

                //compares stored hash password with newly hashed password
                if (dbHash === newHash) {
                    return done(null, user, { message: 'Logged In Successfully' });
                }
                else {
                    return done(null, false, { message: 'Incorrect email or password.' });
                }
            })
            .catch(function (err) {
                console.log(err);
                return done(err);
            });
    }
));

//strategy that allows only requests with valid tokens to access routes needing auth
passport.use('portal-jwt', new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: KEY
},
    function (jwtPayload, callback) {
        //find the user in db if needed
        return query('SELECT * FROM users WHERE id=$1', [jwtPayload.id])
            .then(user => {
                return callback(null, user);
            })
            .catch(err => {
                return callback(err);
            });
    }
));

//strategy that allows only client requests with valid tokens to access routes needing auth
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: KEY
},
    function (jwtPayload, callback) {
        //find the user in db if needed
        return query('SELECT * FROM session WHERE id=$1', [jwtPayload.sessionid])
            .then(client => {
                return callback(null, client.rows[0]);
            })
            .catch(err => {
                return callback(err);
            });
    }
));

function extractJWTToRequest(req,res,next) {
    if(req.headers.authorization) {
        try {
            const pieces = jwt.verify(req.headers.authorization.split(' ')[1],KEY)
            req.jwtInfo = pieces
            return next()
        }
        catch(e) {

        }
    }
}