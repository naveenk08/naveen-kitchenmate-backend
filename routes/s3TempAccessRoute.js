const express = require('express');
const s3Temp = require('../controllers/s3TempAccessController');
const router = express.Router();

router.get('/s3TempKey', s3Temp.s3TempKey);

module.exports = router;
