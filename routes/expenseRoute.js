const express = require("express");
const expenseController = require("../controllers/expenseController.js");

const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.get("/getExpenseMetadata/:id", expenseController.getExpenseMetadata);
router.post(
  "/addExpense",
  upload.single("attachment"),
  expenseController.newExpense
);
router.post("/getExpenseForMonth", expenseController.getExpenseForMonth);
router.get("/deleteExpense", expenseController.deleteExpense);




module.exports = router;
