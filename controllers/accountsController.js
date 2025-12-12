const { accountsModel } = require("../models/accountsModel");
const generateSignedUrl = require("../services/getSignedUrl");

exports.getAccountDetail = async (req, res) => {
  try {
    const { kitchen } = req.query;

    const sale = await accountsModel.getAccountDetail(kitchen);

    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getAccountClosingDetails = async (req, res) => {
  try {

    console.log("Request Body:", req.body);
    const { kitchen, date } = req.body;

    const accountDetails = await accountsModel.getAccountOpeningDetail(
      kitchen,
      date
    );
    const revenueDetails = await accountsModel.getRevenueDetail(kitchen, date);

    const expenseDetails = await accountsModel.expenseDetails(kitchen, date);

    const adjustedDetails = await accountsModel.getAdjustedDetails(
      kitchen,
      date
    );

    res.status(201).json({
      success: true,
      accountDetails,
      revenueDetails,
      expenseDetails,
      adjustedDetails
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to get accounts" });
    console.log(err);
  }
};

exports.updateAccountClosing = async (req, res) => {
  try {
    const { data, date, kitchen } = req.body;

    const mappedData = {
      1: data.cash,
      2: data.account,
    };

    for (const accType of [1, 2]) {
      const amount = mappedData[accType];
      await accountsModel.updateAccountClosing(amount, accType, kitchen, date);
    }

    res.status(201).json({
      success: true,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update accounts" });
    console.log(err);
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { kitchen, Cash, Account, type } = req.body;

    const mappedData = {
      1: parseFloat(Cash),
      2: parseFloat(Account),
      type,
      kitchen,
    };

    for (const accType of [1, 2]) {
      const amount = mappedData[accType];
      await accountsModel.openAccountEntry({
        kitchen,
        type: accType,
        opening: type === "opening" ? amount : null,
      });
    }

    res.status(201).json({
      success: true,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update accounts" });
    console.log(err);
  }
};

exports.reopenAccount = async (req, res) => {
  try {
    const { date, kitchen } = req.body;

    const openAccount = await accountsModel.reopenAccount(date, kitchen);

    if (openAccount.affectedRows > 0) {
      res.status(201).json({
        success: true,
      });
    } else {
      res.status(201).json({
        success: false,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update accounts" });
    console.log(err);
  }
};

exports.getAccountStatus = async (req, res) => {
  try {
    const { kitchen, date } = req.query;

    const status = await accountsModel.getAccountStatusForDay(date, kitchen);

    if (status) {
      res.status(201).json({
        success: true,
        status,
      });
    } else {
      res.status(201).json({
        success: false,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update accounts" });
    console.log(err);
  }
};
exports.adjustAccount = async (req, res) => {
  try {
    const {
      kitchen,
      user,
      date,
      transactionType,
      paymentMethod,
      amount,
      description,
    } = req.body;

    let transactionTypeName
    let paymentMethodName

    if(transactionType == 0) transactionTypeName='Pay In'
    else transactionTypeName = 'Pay Out'

    if(paymentMethod == 0) paymentMethodName='Cash'
    else paymentMethodName = 'Account'


    const status = await accountsModel.adjustAccount(kitchen,
      user,
      date,
      transactionType,
      transactionTypeName,
      paymentMethod,
      paymentMethodName,
      amount,
      description,);

    if (status) {
      res.status(201).json({
        success: true,
        status,
      });
    } else {
      res.status(201).json({
        success: false,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update accounts" });
    console.log(err);
  }
};
