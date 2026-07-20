const express = require('express');
const AppDataController = require('../controllers/appDataController');
const router = express.Router();



router.get('/', AppDataController.getAppData);
router.get('/getUrl', AppDataController.getUrl);
router.get('/getVersion', AppDataController.getVersion);
router.post('/updateVersion',AppDataController.updateVersion);


module.exports = router;
