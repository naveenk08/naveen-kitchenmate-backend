const express = require('express');
const AccountsController = require('../controllers/accountsController');
const router = express.Router();

router.get("/getAccountDetail",AccountsController.getAccountDetail)
router.post("/getAccountClosingDetails",AccountsController.getAccountClosingDetails)
router.post("/updateAccountClosing",AccountsController.updateAccountClosing)
router.post("/updateAccount",AccountsController.updateAccount)
router.post("/reopenAccount",AccountsController.reopenAccount)
router.get("/getAccountStatus",AccountsController.getAccountStatus)
router.post("/adjustAccount",AccountsController.adjustAccount)






module.exports = router;
