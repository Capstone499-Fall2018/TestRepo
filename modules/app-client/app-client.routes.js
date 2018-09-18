const express = require('express');
const router = express.Router();
const appClientController = require('./app-client.controller');

module.exports = router;

router.put('/enrollSubject',appClientController.enrollSubject);
router.put('/enroll/:unid',appClientController.enrollUpdate)
router.put('/idSearch', appClientController.idSearch);
router.put('/irisSearch', appClientController.irisSearch);
router.put('/statusCheck', appClientController.statusCheck);