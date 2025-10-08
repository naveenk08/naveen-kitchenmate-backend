const db = require("../config/db");

const getAppData = async () => {
  const [rows] = await db.query("SELECT * FROM kt_appConfig");
  return rows;
};
const getUrl = async () => {
  const [rows] = await db.query("SELECT * FROM kt_appConfig");
  return rows;
};
module.exports = { getAppData, getUrl };
