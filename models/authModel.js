const db = require("../config/db");

const verifyUser = async (username, password) => {
  //   const { username, password } = req.body;
  const query = `select ku.id,kk.id kId ,ku.firstName,ku.lastname,ku.type,kk.name,kk.addr1,kk.addr2,kk.contact,kk.logo,kk.sub_level,kk.totTables,kk.secret,
  kk.masterDevice,kk.kitchenDevice,kk.defaultCat,kk.defaultPrinting,kk.kotEnabled,kk.printerName, kk.accounts
                from kt_users ku 
                left join kt_kitchens kk 
                on ku.kitchen_id = kk.id
                where ku.email = ?
                and ku.password = ?
                and ku.verified=1;`;

  const [results] = await db.query(query, [username, password]);
  if (results.length > 0) {
    const user = results[0];
    return user;
  } else {
    return false;
  }
};
const getUser = async (id) => {
  //   const { username, password } = req.body;
  const query = `select ku.id,kk.id kId ,ku.firstName,ku.lastname,ku.type,kk.name,kk.addr1,kk.addr2,kk.contact,kk.logo,kk.sub_level,kk.totTables,
  kk.masterDevice,kk.kitchenDevice,kk.defaultCat, kk.defaultPrinting, kk.kotEnabled,kk.printerName, kk.accounts,kk.gst,kk.billFtText
                from kt_users ku 
                left join kt_kitchens kk 
                on ku.kitchen_id = kk.id
                where ku.id = ?`;
  const [results] = await db.query(query, [id]);
  if (results.length > 0) {
    const user = results[0];
    return user;
  } else {
    return false;
  }
};

module.exports = { verifyUser, getUser };
