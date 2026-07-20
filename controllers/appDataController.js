const AppDataModel = require("../models/appDataModel");
const s3Service = require("../services/s3Service");

const fs = require("fs");
const path = require("path");

exports.getAppData = async (req, res, next) => {
  try {
    const data = await AppDataModel.getAppData();
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

exports.getVersion = async (req, res, next) => {
  const { url } = req.query;
  try {
    const [data] = await AppDataModel.getVersion();
    const signedUrl = await s3Service.getDownloadUrl(data.url);
    console.log("data", data);
    res.json({ ...data, downloadUrl: signedUrl });
  } catch (err) {
    next(err);
  }
};

exports.updateVersion = async (req, res, next) => {
  try {
    console.log("=== updateVersion called ===");
    console.log(req.body);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const version = req.body.version;
    console.log(version);

    version.apkKey = `releases/android/Kitchenmate-${version.versionName}.apk`;
    console.log("Before DB");

    await AppDataModel.updateVersion(version);
    console.log("After DB");

    res.json({
      success: true,
      apkKey: version.apkKey,
    });
  } catch (err) {
    next(err);
  }
};
