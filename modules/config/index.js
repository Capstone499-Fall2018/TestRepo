
process.on('unhandledRejection', (err) => {
    throw err
});

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const passport = require('passport');

const passportUtils = require('./passport');

module.exports = app;


//Passport Middleware
app.use(passport.initialize())

//Body Parser Middleware
app.use(bodyParser.json({ type: 'application/json', limit:'50mb' }));
app.use(bodyParser.urlencoded({ extended: false }));


//Routers
// const homeRouter = require('../routes/main');
// const authRouter = require('../routes/auth');
// const cccifRouter = require('../routes/cccif');
// const clientRouter = require('../routes/client');
// const identityRouter = require('../routes/identity');
// const orgRouter = require('../routes/organizations');
// const portalRouter = require('../routes/portal');
// const subjectRouter = require('../routes/subjects');
// const workRouter = require('../routes/work');

const clientRouter = require('../app-client/app-client.routes');
const verifyRouter = require('../app-client/app-client.verifyRouter');

//assigning the routers to their root path
// app.use('/', homeRouter);
// app.use('/auth', authRouter);
// app.use('/cccif', passport.authenticate('jwt', { session: false }), cccifRouter);
//app.use('/client', clientRouter);
app.use('/verify', verifyRouter)
app.use('/client', [passport.authenticate('jwt', { session: false }),passportUtils.extractJWTToRequest], clientRouter);
// app.use('/orgizations', passport.authenticate('jwt', { session: false }), orgRouter);
// app.use('/portal', passport.authenticate('portal-jwt', { session: false }), portalRouter);
// app.use('/subjects', passport.authenticate('jwt', { session: false }), subjectRouter);
// app.use('/work', passport.authenticate('jwt', { session: false }), workRouter);

//Starts server on port 3000
app.listen(3000, function () {
    console.log('Server started on Port 3000..');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res) {
    console.log(err);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500).send();
    res.render('error');
});