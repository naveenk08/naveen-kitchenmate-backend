const AppDataController = require("../models/appDataModel");
const generateSignedUrl = require("../services/getSignedUrl");

exports.getAppData = async (req, res, next) => {
  try {
    const data = await AppDataController.getAppData();
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getUrl = async (req, res, next) => {

  const { url } = req.query;
  try {
    const data = await generateSignedUrl(url);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
