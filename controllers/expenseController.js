const ExpenseModel = require("../models/expenseModel");
const expenseModel = ExpenseModel.expenseModel

const uploadService = require("../services/s3Service");


exports.getExpenseMetadata = async (req, res, next) => {
  try {
    const id = req.params.id;
    const category  = await expenseModel.getExpenseCategory(id);
    const payments  = await expenseModel.getExpensePayments(id);
    if (!category || !payments) return res.status(404).json({ message: "Data not found" });
    res.json({category,payments});
  } catch (err) {
    next(err);
  }
};

exports.newExpense = async (req, res) => {
  try {
    const { user, kitchen, type, paymentType, amount, description, date } =
      req.body;

    const addNewExpense = await expenseModel.newExpense(
      user,
      kitchen,
      type,
      paymentType,
      amount,
      description,
      date
    );

    if (req.file) {
      imageUrl = await uploadService.uploadToS3(
        req.file,
        addNewExpense,
        kitchen,
        "expense"
      );
      await expenseModel.updateAttachment(imageUrl, addNewExpense);
    }

    if (addNewExpense) {
      res.status(201).json({
        success: true,
        message: "Expense added Successfully",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getExpenseForMonth = async (req, res, next) => {
  try {
    const {kitchen, month, year} = req.body;
    
    const expense  = await expenseModel.getExpenseByMonth(kitchen, month, year);
    if (!expense) return res.status(404).json({ message: "Data not found" });
    res.json(expense);
  } catch (err) {
    next(err);
  }
};

exports.deleteExpense = async (req, res) => {
  const { expense } = req.query;

  try {
    if (!expense) {
      return res.status(400).json({ message: "ExpenseId missing" });
    }

    const deleteExpense = await expenseModel.deleteExpense(expense);

    if (deleteExpense.affectedRows > 0) {
      res.status(201).json({
        success: true,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
