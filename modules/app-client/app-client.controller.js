const { findMatch, publishSubjectEnrolled } = require('../config/matchingService');
const { query } = require('../db/db-module');
const VerhoeffCheckDigit = require('../../VerhoeffCheckDigit');

module.exports = {
    enrollSubject,
    enrollUpdate,
    idSearch,
    irisSearch,
    statusCheck
}


//enroll a new subject as long as the matchingService does not return a match
async function enrollSubject(req, res) {
    const suppliedTemplate = req.body.irisTemplate.template;
    if (suppliedTemplate == null) {
        return res.json({
            error: 'You did not supply a template, or the supplied template was in the wrong format. Try again.'
        });
    }

    if (process.env.MOCK) {
        const subject = require('../../mock-data/mock-subject.json');
        const subjectUnid = subject.unid;

        return res.status(201).json({ subject, subjectUnid })
    }

    const match = await findMatch({ TemplateBase64: suppliedTemplate })
    const matchId = match.MatchId;

    if (matchId == null || matchId == 0) {
        console.log('There was no match found for that template in the database');
    }
    else {
        return res.json({
            error: 'You are already enrolled in the system.',
            matchId
        });
    }

    //queries the database to make sure the unid created does not already exist
    let testedUnid = 0;
    while (testedUnid == 0) {
        let generatedUnid = new VerhoeffCheckDigit().generateUnid();
        const sqlTest = 'SELECT * FROM subject WHERE unid=$1'
        const dataTest = [
            generatedUnid
        ]
        testedUnid = (await query(sqlTest, dataTest)).rows[0];
        if (testedUnid == null) {
            testedUnid = generatedUnid;
        }
        else {
            testedUnid = 0;
        }
    }

    var sqlSubject = 'INSERT INTO subject (unid, session_id, create_date) VALUES ($1,$2,$3) RETURNING *';
    var create_date = new Date().toISOString();
    //Insert data from the request body
    var dataSubject = [
        testedUnid,
        req.jwtInfo.sessionid,
        create_date
    ];

    //Insert subject into database and initialize data (within the subject query there are 5 other sub-queries to initialize the identity with the given unid)
    var subjectInfo = (await query(sqlSubject, dataSubject)).rows[0];
    var subjectUnid = subjectInfo.unid;
    var subject = {
        "unid": subjectUnid,
        "sessionId": subjectInfo.session_id,
        "createDate": subjectInfo.create_date
    }


    const rightIrisImage = !req.body.irisTemplate.irisRight ? null : new Buffer(req.body.irisTemplate.irisRight, 'base64')
    const leftIrisImage = !req.body.irisTemplate.irisLeft ? null : new Buffer(req.body.irisTemplate.irisLeft, 'base64')
    const irisLeftType = 'leftIris';
    const irisRightType = 'rightIris';
    //const irisReasonForNoImage = req.body.irisImage.reasonForNoImage;

    var sqlIris = 'INSERT INTO iris (unid, create_date, template) VALUES ($1,$2,$3) RETURNING *';
    //Insert data from the POST body
    var dataIris = [
        subjectUnid,
        create_date,
        new Buffer(suppliedTemplate, 'base64')
    ];
    //Insert Iris data into database and initialize with unid create_date and templates
    var iris = (await query(sqlIris, dataIris)).rows[0];


    let portraitTemplate = req.body.portraitTemplate ? req.body.portraitTemplate.template : null;
    var sqlFace = 'INSERT INTO face (unid, create_date, template) VALUES ($1,$2,$3) RETURNING *';
    //Insert data from the POST body
    var dataFace = [
        subjectUnid,
        create_date,
        portraitTemplate,
    ];
    //Insert face into database and initialize with unid and template
    var face = (await query(sqlFace, dataFace)).rows[0];


    const rightFingerTemplate = !req.body.fingerprintTemplate.rightTemplate ? null : new Buffer(req.body.fingerprintTemplate.rightTemplate, 'base64');
    const leftFingerTemplate = !req.body.fingerprintTemplate.leftTemplate ? null : new Buffer(req.body.fingerprintTemplate.leftTemplate, 'base64');
    const leftThumbImage = !req.body.fingerprintTemplate.leftImage ? null : new Buffer(req.body.fingerprintTemplate.leftImage, 'base64')
    const rightThumbImage = !req.body.fingerprintTemplate.rightImage ? null : new Buffer(req.body.fingerprintTemplate.rightImage, 'base64')
    const leftThumbType = 'leftThumb';
    const rightThumbType = 'rightThumb';

    var sqlFinger = 'INSERT INTO finger (unid, create_date, left_template, right_template) VALUES ($1,$2,$3,$4) RETURNING *';
    //Insert data from the POST body
    var dataFinger = [
        subjectUnid,
        create_date,
        leftFingerTemplate,
        rightFingerTemplate
    ];
    //Insert finger into database and initialize with unid and templates
    var finger = (await query(sqlFinger, dataFinger)).rows[0];

    var sqlPhoto = 'INSERT INTO photo (unid, create_date, image_type, image) VALUES ($1,$2,$3,$4) RETURNING *';
    var portraitImageType = 'portrait';
    const image = req.body.portraitTemplate.image ? new Buffer(req.body.portraitTemplate.image, 'base64') : null
    //Insert data from the POST body
    var dataPortraitPhoto = [
        subjectUnid,
        create_date,
        portraitImageType,
        image
    ];
    var dataLeftIris = [
        subjectUnid,
        create_date,
        irisLeftType,
        leftIrisImage
    ];
    var dataRightIris = [
        subjectUnid,
        create_date,
        irisRightType,
        rightIrisImage
    ];
    var dataLeftThumb = [
        subjectUnid,
        create_date,
        leftThumbType,
        leftThumbImage
    ];
    var dataRightThumb = [
        subjectUnid,
        create_date,
        rightThumbType,
        rightThumbImage
    ];
    //inserts photo into database and initialize with unid, image type, and image
    var portraitPhoto = (await query(sqlPhoto, dataPortraitPhoto)).rows[0];
    var leftIrisPhoto = (await query(sqlPhoto, dataLeftIris)).rows[0];
    var rightIrisPhoto = (await query(sqlPhoto, dataRightIris)).rows[0];
    var leftThumbPhoto = (await query(sqlPhoto, dataLeftThumb)).rows[0];
    var rightThumbPhoto = (await query(sqlPhoto, dataRightThumb)).rows[0];

    //Insert data from the request body
    var sqlBiographic = 'INSERT INTO cccif (unid, date_of_birth, sex,first_name_en, second_name_en, first_name_th, second_name_th, nationality,' +
        'origin_country, passport, pink_card, thai, home, work, employer, reason_for_no_portrait, reason_for_no_finger) VALUES ' +
        '($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *';
    var dateOfBirth = !req.body.biographic ? null : req.body.biographic.dateOfBirth;
    var sex = !req.body.biographic ? null : req.body.biographic.sex;
    var firstNameEn = !req.body.biographic ? null : req.body.biographic.firstNameEn;
    var secondNameEn = !req.body.biographic ? null : req.body.biographic.secondNameEn;
    var firstNameTh = !req.body.biographic ? null : req.body.biographic.firstNameTh;
    var secondNameTh = !req.body.biographic ? null : req.body.biographic.secondNameTh;
    var nationality = !req.body.biographic ? null : req.body.biographic.nationality;
    var originCountry = !req.body.biographic ? null : req.body.biographic.originCountry;

    var passport = !req.body.biographic ? null : req.body.biographic.passport;
    var pinkCard = !req.body.biographic ? null : req.body.biographic.pinkCard;
    var thai = !req.body.biographic ? null : req.body.biographic.thai;

    var home = !req.body.biographic ? null : req.body.biographic.home;
    var work = !req.body.biographic ? null : req.body.biographic.work;
    var employer = !req.body.biographic ? null : req.body.biographic.employer;

    if (leftThumbImage && rightThumbImage) {
        var reasonForNoFinger = null;
    }
    else {
        var reasonForNoFinger = req.body.fingerprintTemplate.reasonForNoImage;
    }
    if (image) {
        var reasonForNoPortrait = null;
    }
    else {
        var reasonForNoPortrait = req.body.portraitTemplate.reasonForNoImage;
    }


    //Insert data from the POST body
    var dataBiographic = [
        subjectUnid,
        dateOfBirth,
        sex,
        firstNameEn,
        secondNameEn,
        firstNameTh,
        secondNameTh,
        nationality,
        originCountry,
        passport,
        pinkCard,
        thai,
        home,
        work,
        employer,
        reasonForNoPortrait,
        reasonForNoFinger
    ]
    const bioDataInfo = (await query(sqlBiographic, dataBiographic)).rows[0];
    if (bioDataInfo.home == null) {
        home = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        home = bioDataInfo.home;
    }
    if (bioDataInfo.work == null) {
        work = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        work = bioDataInfo.work;
    }
    if (bioDataInfo.employer == null) {
        employer = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        employer = bioDataInfo.employer;
    }
    const bioData = {
        "unid": subjectUnid,
        "dateOfBirth": bioDataInfo.date_of_birth,
        "sex": bioDataInfo.sex,
        "firstNameEn": bioDataInfo.first_name_en,
        "secondNameEn": bioDataInfo.second_name_en,
        "firstNameTh": bioDataInfo.first_name_th,
        "secondNameTh": bioDataInfo.second_name_th,
        "nationality": bioDataInfo.nationality,
        "originCountry": bioDataInfo.origin_country,
        "passport": bioDataInfo.passport,
        "pinkCard": bioDataInfo.pink_card,
        "thai": bioDataInfo.thai,
        "home": home,
        "work": work,
        "employer": employer,
        "isAdmin": bioDataInfo.is_admin,
        "isOperator": bioDataInfo.is_operator,
    }

    publishSubjectEnrolled({ Unid: subject.unid, TemplateBase64: iris.template.toString('base64') });

    // The request went through and returns a json object of the created information
    res.statusCode = 201;  //A new resource was created
    return res.json({ subject, subjectUnid, bioData });
}


//function to re-enter the biographic information on an update
async function enrollUpdate(req, res) {
    var sqlBiographic = `UPDATE cccif
            SET date_of_birth = $2, 
            sex = $3,
            first_name_en = $4,
            second_name_en = $5, 
            first_name_th = $6, 
            second_name_th = $7, 
            nationality = $8,
            origin_country = $9, 
            passport = $10, 
            pink_card = $11,
            thai = $12, 
            home = $13, 
            work = $14, 
            employer = $15, 
            reason_for_no_portrait = $16, 
            reason_for_no_finger = $17 WHERE unid = $1  
            RETURNING *`;

    var firstNameTh = req.body.firstNameTh;
    var secondNameTh = req.body.secondNameTh;
    var firstNameEn = req.body.firstNameEn;
    var secondNameEn = req.body.secondNameEn;

    if (req.body.reasonForNoPortrait) {
        var reasonForNoPortrait = req.body.reasonForNoPortrait
    }
    else {
        var reasonForNoPortrait = null;
    }
    if (req.body.reasonForNoFinger) {
        var reasonForNoFinger = req.body.reasonForNoFinger
    }
    else {
        var reasonForNoFinger = null;
    }
    var dateOfBirth = parseInt(req.body.dateOfBirth);
    

    var incomingData = [
        req.body.unid,
        req.body.dateOfBirth,
        req.body.sex,
        firstNameEn,
        secondNameEn,
        firstNameTh,
        secondNameTh,
        req.body.nationality,
        req.body.originCountry,
        req.body.passport,
        req.body.pinkCard,
        req.body.thai,
        req.body.home,
        req.body.work,
        req.body.employer,
        reasonForNoPortrait,
        reasonForNoFinger
    ]
    const bioDataInfo = (await query(sqlBiographic, incomingData)).rows[0];
    if (bioDataInfo.home == null) {
        home = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        home = bioDataInfo.home;
    }
    if (bioDataInfo.work == null) {
        work = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        work = bioDataInfo.work;
    }
    if (bioDataInfo.employer == null) {
        employer = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        employer = bioDataInfo.employer;
    }
    const bioData = {
        "unid": bioDataInfo.unid,
        "dateOfBirth": bioDataInfo.date_of_birth,
        "sex": bioDataInfo.sex,
        "firstNameEn": bioDataInfo.first_name_en,
        "secondNameEn": bioDataInfo.second_name_en,
        "firstNameTh": bioDataInfo.first_name_th,
        "secondNameTh": bioDataInfo.second_name_th,
        "nationality": bioDataInfo.nationality,
        "originCountry": bioDataInfo.origin_country,
        "passport": bioDataInfo.passport,
        "pinkCard": bioDataInfo.pink_card,
        "thai": bioDataInfo.thai,
        "home": home,
        "work": work,
        "employer": employer,
        "isAdmin": bioDataInfo.is_admin,
        "isOperator": bioDataInfo.is_operator,
    }
    // The request went through and returns a json object of the updtated biographic profile
    res.statusCode = 200;  //success, a resource was updated
    return res.json({ bioData });
}



//search for information in the database when given id type and value
async function idSearch(req, res) {
    if (process.env.MOCK) {
        const biographic = require('../../mock-data/mock-cccif.json');
        const subject = require('../../mock-data/mock-subject.json');
        const photo = require('../../mock-data/mock-photo.json');
        const iris = require('../../mock-data/mock-iris.json');
        const fingerprint = require('../../mock-data/mock-finger.json');

        const portrait = {
            "image": photo.image,
            "reasonForNoImage": photo.reasonForNoImage
        }
        const biometric = {
            portrait,
            iris,
            fingerprint
        }

        return res.status(200).json({ biographic, biometric, subject })
    }

    //Grab data from the POST body
    let type = req.body.type;
    const value = req.body.value;
    let searchId;

    if (type == 'passport' || type == 'pinkCard' || type == 'thai') {
    }
    else {
        type = 'passport'
    }
    if (type == 'pinkCard') {
        type = 'pink_card';
    }

    //pulls from the cccif biographic table based on the type of id and value supplied
    const sqlSearch = `SELECT cccif.* 
                FROM cccif 
                WHERE ${type}=$1`
    var dataSearch = [
        value
    ]
    const biographicInfo = (await query(sqlSearch, dataSearch)).rows[0];
    if (!biographicInfo || biographicInfo.unid == null) {
        return res.json({
            error: 'The identification number did not match any of that type. Please try again or proceed to enroll.'
        });
    }
    else {
        searchId = biographicInfo.unid;
    }

    let home;
    let work;
    let employer;
    if (biographicInfo.home == null) {
        home = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        home = biographicInfo.home;
    }
    if (biographicInfo.work == null) {
        work = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        work = biographicInfo.work;
    }
    if (biographicInfo.employer == null) {
        employer = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        employer = biographicInfo.employer;
    }
    const biographic = {
        "unid": biographicInfo.unid,
        "dateOfBirth": biographicInfo.date_of_birth,
        "sex": biographicInfo.sex,
        "firstNameEn": biographicInfo.first_name_en,
        "secondNameEn": biographicInfo.second_name_en,
        "firstNameTh": biographicInfo.first_name_th,
        "secondNameTh": biographicInfo.second_name_th,
        "nationality": biographicInfo.nationality,
        "originCountry": biographicInfo.origin_country,
        "passport": biographicInfo.passport,
        "pinkCard": biographicInfo.pink_card,
        "thai": biographicInfo.thai,
        "home": home,
        "work": work,
        "employer": employer,
        "reasonForNoPortrait": biographicInfo.reason_for_no_portrait,
        "reasonForNoFinger": biographicInfo.reason_for_no_finger,
        "isAdmin": biographicInfo.is_admin,
        "isOperator": biographicInfo.is_operator,
    }


    //query for subject information
    const sqlSubject = `SELECT subject.* 
                FROM subject 
                WHERE unid=$1`;
    const subjectInfo = (await query(sqlSubject, [searchId])).rows[0];
    var subject = {
        "unid": !subjectInfo ? null : subjectInfo.unid,
        "sessionId": !subjectInfo ? null : subjectInfo.session_id,
        "createDate": !subjectInfo ? null : subjectInfo.create_date
    }

    //query for biometric data
    const sqlPhoto = `SELECT photo.* 
                FROM photo 
                WHERE unid=$1 AND image_type=$2`;
    const photoInfo = (await query(sqlPhoto, [searchId, 'portrait'])).rows[0];
    const leftThumbPhotoInfo = (await query(sqlPhoto, [searchId, 'leftThumb'])).rows[0];
    const rightThumbPhotoInfo = (await query(sqlPhoto, [searchId, 'rightThumb'])).rows[0];
    let image = !photoInfo ? null : photoInfo.image
    image = !image ? null : photoInfo.image.toString('base64')
    const photo = {
        "unid": !photoInfo ? null : photoInfo.unid,
        "createDate": !photoInfo ? null : photoInfo.create_date,
        "imageType": !photoInfo ? null : photoInfo.image_type,
        "image": image,
        "reasonForNoImage": !photoInfo ? null : photoInfo.reason_for_no_image,
        "leftThumbImage": !leftThumbPhotoInfo ? null : leftThumbPhotoInfo.image,
        "rightThumbImage": !rightThumbPhotoInfo ? null : rightThumbPhotoInfo.image
    }

    const sqlIris = `SELECT iris.* 
                FROM iris 
                WHERE unid=$1`;
    const irisInfo = (await query(sqlIris, [searchId])).rows[0];
    const iris = {
        "unid": !irisInfo ? null: irisInfo.unid,
        "createDate": !irisInfo ? null: irisInfo.create_date
    }

    const sqlFinger = `SELECT finger.* 
                FROM finger 
                WHERE unid=$1`;
    const fingerprintInfo = (await query(sqlFinger, [searchId])).rows[0];
    const fingerprint = {
        "unid": !fingerprintInfo ? null : fingerprintInfo.unid,
        "createDate": !fingerprintInfo ? null : fingerprintInfo.create_date,
        "leftFinger": !photo ? null : photo.leftThumbImage,
        "rightFinger": !photo ? null : photo.rightThumbImage,
        "reasonForNoImage": !fingerprintInfo ? null : fingerprintInfo.reason_for_no_image
    }

    const portrait = {
        "image": photo ? photo.image : null,
        "reasonForNoImage": photo ? photo.reasonForNoImage : null
    }

    const biometric = {
        portrait,
        iris,
        fingerprint
    }


    return res.json({ biographic, biometric, subject });
}


//search for information in the database by scaning
async function irisSearch(req, res) {
    if (process.env.MOCK) {
        const biographic = require('../../mock-data/mock-cccif.json');
        const subject = require('../../mock-data/mock-subject.json');
        const photo = require('../../mock-data/mock-photo.json');
        const iris = require('../../mock-data/mock-iris.json');
        const fingerprint = require('../../mock-data/mock-finger.json');

        const portrait = {
            "image": photo.image,
            "reasonForNoImage": photo.reasonForNoImage
        }
        const biometric = {
            portrait,
            iris,
            fingerprint
        }

        return res.status(200).json({ biographic, biometric, subject })
    }

    //Grab data from the POST body
    const suppliedTemplate = req.body.template
    let searchId;

    //creates a queue of templates that need to be checked for a match. If match is found then grab the rest of the information and return one payload
    const match = await findMatch({ TemplateBase64: suppliedTemplate })
    searchId = match.MatchId;
    if (searchId == null || searchId == 0) {
        return res.json({
            error: 'Your iris template is not in the system. Proceed to enroll.'
        });
    }


    //pulls from the cccif biographic table based on the type of id and value supplied
    const sqlSearch = `SELECT cccif.* 
                FROM cccif 
                WHERE unid=$1`
    var dataSearch = [
        searchId
    ]
    const biographicInfo = (await query(sqlSearch, dataSearch)).rows[0];
    if (!biographicInfo || biographicInfo.unid == null) {
        return res.json({
            error: 'Your Iris template did not match any biographic information. Try again.'
        });
    }
    let home;
    let work;
    let employer;
    if (biographicInfo.home == null) {
        home = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        home = biographicInfo.home;
    }
    if (biographicInfo.work == null) {
        work = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        work = biographicInfo.work;
    }
    if (biographicInfo.employer == null) {
        employer = {
            "address": null,
            "city": null,
            "postalCode": null,
            "country": null
        }
    }
    else {
        employer = biographicInfo.employer;
    }
    const biographic = {
        "unid": biographicInfo.unid,
        "dateOfBirth": biographicInfo.date_of_birth,
        "sex": biographicInfo.sex,
        "firstNameEn": biographicInfo.first_name_en,
        "secondNameEn": biographicInfo.second_name_en,
        "firstNameTh": biographicInfo.first_name_th,
        "secondNameTh": biographicInfo.second_name_th,
        "nationality": biographicInfo.nationality,
        "originCountry": biographicInfo.origin_country,
        "passport": biographicInfo.passport,
        "pinkCard": biographicInfo.pink_card,
        "thai": biographicInfo.thai,
        "home": home,
        "work": work,
        "employer": employer,
        "isAdmin": biographicInfo.is_admin,
        "isOperator": biographicInfo.is_operator,
    }


    //query for subject information
    const sqlSubject = `SELECT subject.* 
                FROM subject 
                WHERE unid=$1`;
    const subjectInfo = (await query(sqlSubject, dataSearch)).rows[0];
    var subject = {
        "unid": !subjectInfo ? null : subjectInfo.unid,
        "sessionId": !subjectInfo ? null : subjectInfo.session_id,
        "createDate":!subjectInfo ? null : subjectInfo.create_date
    }

    //query for biometric data
    const sqlPhoto = `SELECT photo.* 
                FROM photo 
                WHERE unid=$1 AND image_type=$2`;
    const photoInfo = (await query(sqlPhoto, [searchId, 'portrait'])).rows[0];
    const leftThumbPhotoInfo = (await query(sqlPhoto, [searchId, 'leftThumb'])).rows[0];
    const rightThumbPhotoInfo = (await query(sqlPhoto, [searchId, 'rightThumb'])).rows[0];
    let image = !photoInfo ? null : photoInfo.image
    image = !image ? null : photoInfo.image.toString('base64')
    const photo = {
        "unid": !photoInfo ? null : photoInfo.unid,
        "createDate": !photoInfo ? null : photoInfo.create_date,
        "imageType": !photoInfo ? null : photoInfo.image_type,
        "image": image,
        "reasonForNoImage": !photoInfo ? null : photoInfo.reason_for_no_image,
        "leftThumbImage": !leftThumbPhotoInfo ? null : leftThumbPhotoInfo.image,
        "rightThumbImage": !rightThumbPhotoInfo ? null : rightThumbPhotoInfo.image
    }

    const sqlIris = `SELECT iris.* 
                FROM iris 
                WHERE unid=$1`;
    const irisInfo = (await query(sqlIris, dataSearch)).rows[0];
    const iris = {
        "unid": !irisInfo ? null: irisInfo.unid,
        "createDate": !irisInfo ? null: irisInfo.create_date
    }

    const sqlFinger = `SELECT finger.* 
                FROM finger 
                WHERE unid=$1`;
    const fingerprintInfo = (await query(sqlFinger, dataSearch)).rows[0];
    const fingerprint = {
        "unid": !fingerprintInfo ? null : fingerprintInfo.unid,
        "createDate": !fingerprintInfo ? null : fingerprintInfo.create_date,
        "leftFinger": !photo ? null : photo.leftThumbImage,
        "rightFinger": !photo ? null : photo.rightThumbImage,
        "reasonForNoImage": !fingerprintInfo ? null : fingerprintInfo.reason_for_no_image
    }

    const portrait = {
        "image": !photo ? null : photo.image,
        "reasonForNoImage": !photo ? null : photo.reasonForNoImage
    }

    const biometric = {
        portrait,
        iris,
        fingerprint
    }


    return res.json({ biographic, biometric, subject });
}

async function statusCheck(req, res) {
    return res.status(200);
}