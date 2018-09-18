const { query } = require('../db/db-module');
const jwt = require('jsonwebtoken');
const APP_SECRET = 'super_secret_needs_to_come_from_settings';
const { findMatch } = require('../config/matchingService');

module.exports = { verifyClientPin, verifyIris }

//function to verify that the given client id and pin match what is stored in the database. returns a client json object.
async function verifyClientPin(req, res) {
    const suppliedPin = req.body.pin;
    const suppliedId = req.body.id;

    //id verification (checks to make sure the id given is the correct format)
    if (suppliedPin && (suppliedPin.length < 6) || (suppliedPin.length > 24)) {
        return res.json({
            errors: ['That is not correct id format, try again.']
        })
    }
    //pin verification (checks to make sure the pin given is the correct format)
    if (suppliedId && (suppliedId.length < 6) || (suppliedId.length > 6)) {
        return res.json({
            errors: ['That is not correct pin format, try again.']
        })
    }



    if (process.env.MOCK) {
        const client = require('../../mock-data/mock-client.json');
        return res.status(200).json(client);
    }

    const clientPinInfo = (await query('SELECT * FROM clientpin WHERE id=$1 AND pin=$2', [suppliedId, suppliedPin])).rows[0]
    const verifiedId = clientPinInfo.id;
    const verifiedPin = clientPinInfo.pin;
    //pulls from a test table I created called clientpin
    const sqlClient = `SELECT client.* 
                FROM client 
                INNER JOIN clientpin 
                ON client.id = clientpin.id 
                WHERE clientpin.pin=$1 
                AND clientpin.id=$2`
    var dataClient = [
        verifiedPin,
        verifiedId
    ]
    const client = (await query(sqlClient, dataClient)).rows[0];

    //query for the client licenses by client id
    const sqlLicense = `SELECT licenses.* FROM licenses   
                WHERE client_id=$1 RETURNING *`
    var dataLicense = [
        client.id
    ]
    const licenses = (await query(sqlLicense, dataLicense)).rows[0];

    // The request went through and returns a json object of the client profile
    res.statusCode = 200;
    return res.json({ client, licenses });
}

//function to verify that the template given matches a subject in the database. returns a subjet json object and a names json object
async function verifyIris(req, res) {
    const suppliedTemplate = req.body.template;
    if (suppliedTemplate == null) {
        return res.json({
            error: 'You did not supply a template, or the template was in the wrong format. Try again.'
        });
    }

    if (process.env.MOCK) {
        const mockCCCIF = require('../../mock-data/mock-cccif.json');
        const user = {
            "firstNameEn": mockCCCIF.firstNameEn,
            "secondNameEn": mockCCCIF.secondNameEn,
            "firstNameTh": mockCCCIF.firstNameTh,
            "secondNameTh": mockCCCIF.secondNameTh
        }
        const subject = require('../../mock-data/mock-subject.json');
        const token = generateSubjectToken(subject);

        return res.status(200).json({ user, subject, token })
    }

    //creates a queue of templates that need to be checked for a match. If match is found then proceed to check admin credentials
    const match = await findMatch({ TemplateBase64: suppliedTemplate })
    const matchId = match.MatchId;

    if (matchId == null || matchId == 0) {
        return res.json({
            error: 'You are not in the system, permissions are required for this action.'
        });
    }
    else {
        var returnedUnid = match.MatchId;
    }

    //Insert data from the POST body
    var data = [
        returnedUnid
    ]
    const sqlNames = `SELECT cccif.* 
                FROM cccif 
                WHERE unid=$1`

    const cccif = (await query(sqlNames, data)).rows[0];

    if (!cccif || !cccif.is_operator) {
        return res.json({
            error: 'You are not an operator, permissions are required for this action.'
        });
    }

    //pulls from the subject table based on the template supplied
    const sql = `SELECT subject.* 
                FROM subject 
                WHERE unid=$1`


    const subjectInfo = (await query(sql, data)).rows[0];
    var subject = {
        "unid": subjectInfo.unid,
        "sessionId": subjectInfo.session_id,
        "createDate": subjectInfo.create_date
    }

    const user = {
        "firstNameEn": cccif.first_name_en,
        "secondNameEn": cccif.second_name_en,
        "firstNameTh": cccif.first_name_th,
        "secondNameTh": cccif.second_name_th
    }

    const sqlSession = `INSERT INTO session 
                        (geolocation, device_info) 
                        VALUES ($1,$2) RETURNING *`
    const dataSession = [
        req.body.geolocation,
        req.body.deviceInfo
    ]

    const sessionInfo = (await query(sqlSession, dataSession)).rows[0];
    const sessionId = sessionInfo.id;

    //generates a token that is signed to the subject json object
    const token = generateSubjectToken(subject, sessionId);

    // The request went through and returns a json object of the subject profile along with their name
    res.statusCode = 200;
    return res.json({ user, subject, token });
}

//function to generate a subject-specific token with a 7 day lifespan
function generateSubjectToken(subject, sessionId) {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign({
        unid: subject.unid,
        sessionid: sessionId,
        exp: parseInt(expiry.getTime() / 1000)
    }, APP_SECRET);
}