const mysql = require("mysql2");

require("dotenv").config();


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  timezone: "+05:30",
  ssl: { rejectUnauthorized: true },
});
pool.on("connection", (connection) => {
  console.log("New database connection established");
  connection.query(
    "SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))",
    (err) => {
      if (err) {
        console.error("Failed to set sql_mode:", err);
      }
    },
  );
  connection.query("SET time_zone = '+05:30'");
});
module.exports = pool.promise();
