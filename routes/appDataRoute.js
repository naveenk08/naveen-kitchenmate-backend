const express = require('express');
const AppDataController = require('../controllers/appDataController');
const router = express.Router();

router.get('/', AppDataController.getAppData);
router.get('/getUrl', AppDataController.getUrl);

module.exports = router;
