const express = require('express');
const router = express.Router();
const { query } = require('../db/db-module');
const { findMatch } = require('../config/matchingService');


// GET all clients
router.get('/', function (req, res) {
    query('SELECT * FROM client', function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ client: result.rows });
    });
});

// GET client information
router.get('/:id', function (req, res, ) {
    query('SELECT * FROM client WHERE id=$1', [req.params.id], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ client: result.rows });
    });
});

// checks to see if a subjects iris template already exists in the database
router.post('/checkMatch', function (req, res, ) {
    //retrieve data from request body
    var irisTemplate_n = req.body.irisTemplate_n;

    //creates a queue of templates that need to be checked for a match. If match then there is no need to enroll
    if ((await findMatch(irisTemplate_n)).matchUnid == null) {
        return res.json({
            No_Match: ['subject is not in the system, proceed to the enroll step.']
        });
    }
    else {
        var unid = (await findMatch(irisTemplate_n)).matchUnid;
    }

    query('SELECT * FROM subject WHERE unid=$1', [unid], function (err, result) {
        if (err) {
            return console.error('error running query', err)
        }
        res.send({ subject: result.rows });
    });
});

//create a new subject and initialize identity, iris, face, finger and photo with the unid given to the subject
router.post('/enroll', function (req, res) {
    //retrieve data from request body
    var irisTemplate_n = req.body.irisTemplate_n;
    var irisTemplate_ml = req.body.irisTemplate_ml;
    var irisTemplate_mr = req.body.irisTemplate_mr;

    var faceTemplate_n = req.body.faceTemplate_n;
    var faceImageType = req.body.faceImageType;
    var faceImage = req.body.faceImage;

    var fingerTemplate_n = req.body.fingerTemplate_n;
    var fingerTemplate_ml = req.body.fingerTemplate_ml;
    var fingerTemplate_mr = req.body.fingerTemplate_mr;

    //creates a queue of templates that need to be checked for a match. If match then there is no need to enroll
    if (!((await findMatch(irisTemplate_n)).matchUnid == null)) {
        return res.json({
            Match: ['You are already enrolled in the system']
        });
    }

    var sqlSubject = 'INSERT INTO subject (unid, template, active_count, active_date, active_orgid,' +
        'active_clientid, active_unid, active_location, create_date, create_orgid, create_clientid, create_unid, create_location,' +
        'secure_key, is_active, is_admin, is_locked, is_secure, is_update) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,' +
        '$13,$14,$15,$16,$17,$18,$19) RETURNING unid';
    var create_date = new Date().toISOString();
    //Insert data from the request body
    var dataSubject = [
        req.body.unid,
        req.body.template,
        req.body.active_count,
        req.body.active_date,
        req.body.active_orgid,
        req.body.active_clientid,
        req.body.active_unid,
        req.body.avtive_location,
        create_date,
        req.body.create_orgid,
        req.body.create_clientid,
        req.body.create_unid,
        req.body.create_location,
        req.body.secure_key,
        req.body.is_active,
        req.body.is_admin,
        req.body.is_locked,
        req.body.is_secure,
        req.body.is_update,
    ];

    //Insert subject into database and initialize data (within the subject query there are 5 other sub-queries to initialize the identity with the given unid)
    query(sqlSubject, dataSubject, function (err, result) {
        if (err) {
            // We hide our clients from internal errors, but log them
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Failed to create subject']
            });
        }
        subjectUnid = result.rows[0].unid;

        var sqlIdentity = 'INSERT INTO identity (unid, active_count, active_date, active_unid, active_clientid, active_orgid,' +
            'active_location, create_date, create_unid, create_clientid, create_orgid, create_location, is_active, is_admin, is_locked,' +
            'is_secure, is_update) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)';
        //Insert data from the POST body
        var dataIdentity = [
            subjectUnid,
            req.body.active_count,
            create_date,
            req.body.active_unid, ,
            req.body.active_clientid,
            req.body.active_orgid,
            req.body.avtive_location,
            create_date,
            req.body.create_unid,
            req.body.create_clientid,
            req.body.create_orgid,
            req.body.create_location,
            req.body.is_active,
            req.body.is_admin,
            req.body.is_locked,
            req.body.is_secure,
            req.body.is_update
        ];

        //Insert Identity data into database and initialize with unid and subject information
        query(sqlIdentity, dataIdentity, function (err, result) {
            if (err) {
                // We hide our clients from internal errors, but log them
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Failed to create Identity in database']
                });
            }
            console.log(result.rows[0]);
        });

        var sqlIris = 'INSERT INTO iris (unid, create_date, template_n, template_ml, template_mr) VALUES ($1,$2,$3,$4,$5)';
        //Insert data from the POST body
        var dataIris = [
            subjectUnid,
            create_date,
            irisTemplate_n,
            irisTemplate_ml,
            irisTemplate_mr
        ];

        //Insert Iris data into database and initialize with unid create_date and templates
        query(sqlIris, dataIris, function (err, result) {
            if (err) {
                // We hide our clients from internal errors, but log them
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Failed to create Iris in database']
                });
            }
            console.log(result.rows[0]);
        });

        var sqlFace = 'INSERT INTO face (unid, create_date, template_n) VALUES ($1,$2,$3)';
        //Insert data from the POST body
        var dataFace = [
            subjectUnid,
            create_date,
            faceTemplate_n
        ];

        //Insert face into database and initialize with unid and template
        query(sqlFace, dataFace, function (err, result) {
            if (err) {
                // We shield our clients from internal errors, but log them
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Failed to craeate face in database']
                });
            }
            console.log(result.rows[0]);
        });

        var sqlFinger = 'INSERT INTO finger (unid, create_date, template_n, template_ml, template_mr) VALUES ($1,$2,$3,$4,$5)';
        //Insert data from the POST body
        var dataFinger = [
            subjectUnid,
            create_date,
            fingerTemplate_n,
            fingerTemplate_ml,
            fingerTemplate_mr
        ];

        //Insert finger into database and initialize with unid and templates
        query(sqlFinger, dataFinger, function (err, result) {
            if (err) {
                // We shield our clients from internal errors, but log them
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Failed to craeate finger in database']
                });
            }
            console.log(result.rows[0]);
        });

        var sqlPhoto = 'INSERT INTO photo (unid, create_date, image_type, image) VALUES ($1,$2,$3,$4)';
        //Insert data from the POST body
        var dataPhoto = [
            subjectUnid,
            create_date,
            faceImageType,
            faceImage
        ];

        //inserts photo into database and initialize with unid, image type, and image
        query(sqlPhoto, dataPhoto, function (err, result) {
            if (err) {
                // We shield our clients from internal errors, but log them
                console.error(err);
                res.statusCode = 500;
                return res.json({
                    errors: ['Failed to craeate photo in database']
                });
            }
            console.log(result.rows[0]);
        });
    });
});

//create a new fishworker and insert biographic, session, and artifact data
router.post('/enroll/biographic', function (req, res) {
    //Insert data from the request body
    var id = req.body.id;
    var birthDate = req.body.birth_date;
    var sexCode = req.body.sex_code;
    if (req.body.first_name_eng == null || req.body.second_name_eng == null) {
        var firstName = req.body.first_name_thai;
        var secondName = req.body.second_name_thai;

        var sqlBiographic = 'INSERT INTO cccif (id, birth_date, sex_code, first_name_thai, second_name_thai, nationality,' +
            'country_of_residence, passport_number, alien_id, thai_id, home_address, work_address, other_address) VALUES ($1,$2,$3,' +
            '$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)';
    }
    else {
        var firstName = req.body.first_name_eng;
        var secondName = req.body.second_name_eng;

        var sqlBiographic = 'INSERT INTO cccif (id, birth_date, sex_code, first_name_eng, second_name_eng, nationality,' +
            'country_of_residence, passport_number, alien_id, thai_id, home_address, work_address, other_address) VALUES ($1,$2,$3,' +
            '$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)';
    }
    var nationality = req.body.nationality;
    var countryOfResidence = req.body.country_of_residence;

    //one of the three identification numbers required, others could be blank
    if (req.body.passport_number == null) {
        var passportNumber = null;
    }
    else {
        var passportNumber = req.body.passport_number;
    }
    if (req.body.alien_id == null) {
        var alienId = null;
    }
    else {
        var alienId = req.body.alien_id;
    }
    if (req.body.thai_id == null) {
        var thaiId = null;
    }
    else {
        var thaiId = req.body.thai_id;
    }

    //one of the three address fields required, others could be blank
    if (req.body.home_address == null) {
        var home_address = null;
    }
    else {
        var home_address = req.body.home_address;
    }
    if (req.body.work_address == null) {
        var work_address = null;
    }
    else {
        var work_address = req.body.work_address;
    }
    if (req.body.other_address == null) {
        var other_address = null;
    }
    else {
        var other_address = req.body.other_address;
    }



    var dataBiographic = [
        id,
        birthDate,
        sexCode,
        firstName,
        secondName,
        nationality,
        countryOfResidence,
        passportNumber,
        alienId,
        thaiId,
        home_address,
        work_address,
        other_address
    ];

    //Insert fishworker into database and initialize data
    query(sqlBiographic, dataBiographic, function (err, result) {
        if (err) {
            // We hide our clients from internal errors, but log them
            console.error(err);
            res.statusCode = 500;
            return res.json({
                errors: ['Failed to insert biographic data']
            });
        }
        console.log(result.rows[0]);
    });

    //
    //TODO: Fill out data from the request body for session and artifact data
    //I dont know what format the session and artifact data will be coming in as
    //

    // var sqlSession = 'INSERT INTO session () VALUES ($1)';
    // //Insert data from the POST body
    // var dataSession = [

    // ];

    // //Insert session data into database
    // query(sqlSession, dataSession, function (err, result) {
    //     if (err) {
    //         // We hide our clients from internal errors, but log them
    //         console.error(err);
    //         res.statusCode = 500;
    //         return res.json({
    //             errors: ['Failed to insert session data into database']
    //         });
    //     }
    //     console.log(result.rows[0]);
    // });

    // var sqlArtifacts = 'INSERT INTO artifacts () VALUES ($1)';
    // //Insert data from the POST body
    // var dataArtifacts = [

    // ];

    // //Insert artifact data into database
    // query(sqlArtifacts, dataArtifacts, function (err, result) {
    //     if (err) {
    //         // We hide our clients from internal errors, but log them
    //         console.error(err);
    //         res.statusCode = 500;
    //         return res.json({
    //             errors: ['Failed to insert artifact data into database']
    //         });
    //     }
    //     console.log(result.rows[0]);
    // });
    // res.statusCode = 200;
    // return res.json({
    //     Success: ['You have successfully enrolled a new subject.']
    // });

});

module.exports = router;