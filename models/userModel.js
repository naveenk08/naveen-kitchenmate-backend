const db = require("../config/db");

const UserModel = {
  createUser: async (firstname, lastname, email, password, contact, otp) => {
    const sql = `INSERT INTO kt_users (firstname, lastname, email, password, contact, otp,updatetime) VALUES (?, ?, ?, ?, ?, ?,sysdate())`;
    const [result] = await db.execute(sql, [
      firstname,
      lastname,
      email,
      password,
      contact,
      otp,
    ]);
    return result;
  },

  updateUserOTP: async (email, otp) => {
    const sql = `UPDATE kt_users set otp = ? WHERE email = ?`;
    const [result] = await db.execute(sql, [otp, email]);
    return result;
  },
  updateUserDetails: async (id, firstName, lastName, contact) => {
    const sql = `UPDATE kt_users set firstName=?, lastName=?, contact=?, updatetime=sysdate() where id=?`;
    const [result] = await db.execute(sql, [firstName, lastName, contact, id]);
    return result;
  },

  updatePass: async (id, oldPass, newPass) => {
    const sql = `UPDATE kt_users set password = ? where id=? and password = ?`;
    const [result] = await db.execute(sql, [newPass, id, oldPass]);
    return result;
  },

  approveUserForKitchen: async (id, type) => {
    const sql = `UPDATE kt_users set approval = 'A', type= ? where id=?`;
    const [result] = await db.execute(sql, [type, id]);
    return result;
  },

  rejectUserForKitchen: async (id) => {
    const sql = `UPDATE kt_users set approval = 'R'where id=?`;
    const [result] = await db.execute(sql, [id]);
    return result;
  },

  updateAdminUserKitchen: async (uid, kid) => {
    const sql = `UPDATE kt_users set kitchen_id = ?, type=0, approval ='A' WHERE id = ?`;
    const [result] = await db.execute(sql, [kid, uid]);
    return result;
  },

  getActiveUserByEmail: async (email) => {
    const sql = `SELECT * FROM kt_users WHERE email = ? and verified != NULL`;
    const [rows] = await db.execute(sql, [email]);
    return rows[0];
  },

  getInactiveUserByEmail: async (email) => {
    const sql = `SELECT * FROM kt_users WHERE email = ? and verified is NULL`;
    const [rows] = await db.execute(sql, [email]);
    return rows[0];
  },

  verifyOTP: async (email, otp) => {
    const sql = `SELECT * FROM kt_users WHERE email = ? AND otp = ?`;
    const [rows] = await db.execute(sql, [email, otp]);
    return rows[0];
  },

  updateVerifiedStatus: async (email) => {
    const sql = `UPDATE kt_users SET verified = 1 WHERE email = ?`;
    await db.execute(sql, [email]);
  },
};

module.exports = UserModel;
