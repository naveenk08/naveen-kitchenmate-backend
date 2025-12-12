const db = require("../config/db");

const getKitchen = async (name, contact) => {
  const [rows] = await db.query(
    "SELECT * FROM kt_kitchens where name=? and contact=? ",
    [name, contact]
  );
  return rows;
};
const getKitchenById = async (id) => {
  const [rows] = await db.query("SELECT * FROM kt_kitchens where id=? ", [id]);
  return rows[0];
};
const getKitchenBySecret = async (value) => {
  const [rows] = await db.query("SELECT * FROM kt_kitchens where secret=? ", [
    value,
  ]);

  return rows;
};

const getDefaultDiscount = async (kitchenId) => {
  const [rows] = await db.query(
    "select id, mapValue defaultDiscount from kt_masterMapping where kitchenId = ? and mapType = 'DefaultDiscount' and delFlag=0",
    [kitchenId]
  );
  return rows[0];
};
const getPendingUserApproval = async (id) => {
  const [rows] = await db.query(
    "SELECT *,DATE_FORMAT(updatetime, '%d-%m-%Y %I:%i %p') updateTime FROM kt_users where approval is NULL and verified=1 and kitchen_id=? ",
    [id]
  );

  return rows;
};
const updateLogo = async (id, url) => {
  const [rows] = await db.query(
    "update kt_kitchens set logo = ? where id = ?",
    [url, id]
  );
  return rows;
};

const getTaxDetails = async (kitchenId) => {
  const [rows] = await db.query(
    `SELECT id, mapDesc , mapValue  FROM kt_masterMapping 
    WHERE mapType = 'Tax' AND kitchenId = ? AND delFlag = 0`,
    [kitchenId]
  );
  return rows;
};

const updateKitchenDetails = async (
  id,
  name,
  addr1,
  addr2,
  contact,
  email,
  table,
  custOrder,
  defaultCat,
  defaultPrinting,
  kot
) => {
  const sql = `UPDATE kt_kitchens set name=?, addr1=?, addr2=?, contact=?,custOrder=?,
  email=?,totTables=?,defaultCat=?,defaultPrinting = ?, kotEnabled = ?,updatetime = sysdate() where id=?`;
  const [result] = await db.execute(sql, [
    name,
    addr1,
    addr2,
    contact,
    custOrder,
    email,
    table,
    defaultCat,
    defaultPrinting,
    kot,
    id,
  ]);
  return result;
};

const updateDefaultDiscount = async (kitchenId, defaultDiscount) => {
  const sql = `UPDATE kt_masterMapping set mapValue=?, updatetime = sysdate(), delFlag=0 where kitchenId=? and mapType='DefaultDiscount'`;
  const [result] = await db.execute(sql, [defaultDiscount, kitchenId]);
  if(result.affectedRows === 0){
    const insertSql = `INSERT INTO kt_masterMapping (mapType, kitchenId, mapValue, delFlag, updatetime) VALUES ('DefaultDiscount', ?, ?, 0, sysdate())`;
    const [insertResult] = await db.execute(insertSql, [kitchenId, defaultDiscount]);
    return insertResult;
  }
  return result;
};

const insertKitchen = async (
  kitchenName,
  address1,
  address2,
  contact,
  email,
  secret,
  tables
) => {
  const query =
    "INSERT INTO kt_kitchens (name,addr1,addr2,contact,email,secret,totTables,sub_level,custOrder,updatetime) VALUES (?, ?, ?, ?, ?,?,?,1,0,sysdate())";
  const [result] = await db.query(query, [
    kitchenName,
    address1,
    address2,
    contact,
    email,
    secret,
    tables,
  ]);
  return result;
};

const getKitchenCounters = async (id) => {
  const [rows] = await db.query(
    "select id counterId, mapValue counterName from kt_masterMapping where kitchenId = ? and mapType = 'KitchenCounter'",
    [id]
  );
  return rows;
};
const getPaymentOptions = async (id) => {
  const [rows] = await db.query(
    `select id optionId, mapValue optionName from kt_masterMapping 
    where kitchenId in (0, ?) and delFlag=0 and mapType = 'PaymentOption'`,
    [id]
  );

  return rows;
};
const deletePaymentOption = async (id) => {
  const [rows] = await db.query(
    "update kt_masterMapping set delFlag = 1 where id = ?",
    [id]
  );

  return rows;
};
const addPaymentOption = async (kitchenId, optionName) => {
  const [rows] = await db.query(
    "insert into kt_masterMapping (mapType,kitchenId,mapValue,delFlag,updatetime) values ('PaymentOption',?,?,0,sysdate())",
    [kitchenId, optionName]
  );

  return rows;
};
const getRevenue = async (kitchenId) => {
  const [rows] = await db.query(
    `
SELECT 
  d.label,
  IFNULL(SUM(CAST(o.net_amount AS DECIMAL(10,0))), 0) AS total_revenue,
  COUNT(o.orderId) AS total_items
FROM (
  SELECT CURDATE() AS order_date, 'Today' AS label
  UNION ALL
  SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Yesterday'
) d
LEFT JOIN kt_orderHeader o
  ON DATE(o.orderTime) = d.order_date AND o.delFlag = 0
and o.kitchenId= ? and status = 1
GROUP BY d.order_date, d.label
ORDER BY d.order_date DESC;
`,
    [kitchenId]
  );

  return rows;
};
const getExpense = async (kitchenId) => {
  const [rows] = await db.query(
    `SELECT d.date, IFNULL(SUM(e.expenseAmount), 0) AS amount
FROM (
    SELECT CURDATE() AS date
    UNION ALL
    SELECT CURDATE() - INTERVAL 1 DAY
) d
LEFT JOIN kt_expenses e ON DATE(e.expenseDate) = d.date AND e.kitchenId = ?
GROUP BY d.date
ORDER BY d.date;
`,
    [kitchenId]
  );

  return rows;
};
const getLatestOrders = async (kitchenId) => {
  const [rows] = await db.query(
    `
SELECT 
  orderId AS invoice_id,
  orderNum AS invoice_number,
  billName,
   CASE 
        WHEN oh.tableId = 0 THEN 'Parcel'
        ELSE CONCAT(km.mapValue, ' ', kt.tableName)
    END AS table_number,
  CAST(net_amount AS DECIMAL(10,2)) AS net_amount,
  orderTime,
  CONCAT(
    CASE
      WHEN TIMESTAMPDIFF(MINUTE, orderTime, NOW()) < 60 THEN 
        TIMESTAMPDIFF(MINUTE, orderTime, NOW())
      ELSE 
        TIMESTAMPDIFF(HOUR, orderTime, NOW())
    END,
    ' ',
    CASE
      WHEN TIMESTAMPDIFF(MINUTE, orderTime, NOW()) < 60 THEN 'min ago'
      ELSE 'hr ago'
    END
  ) AS time_ago
FROM kt_orderHeader oh
LEFT JOIN 
    kt_tables kt ON oh.tableId = kt.tableId
LEFT JOIN 
    kt_masterMapping km ON kt.areaId = km.id
WHERE oh.delFlag = 0
and oh.status = 1
and oh.kitchenId = ?
ORDER BY orderTime DESC
LIMIT 8;
`,
    [kitchenId]
  );

  return rows;
};
const getPendingOrders = async (kitchenId) => {
  const [rows] = await db.query(
    `
SELECT 
    oh.orderId,
    oh.orderNum,
    oh.billName,
    oh.kitchenId,
    oh.orderTime,
    oh.net_amount,
     CASE 
        WHEN oh.tableId = 0 THEN 'Parcel'
        ELSE CONCAT(km.mapValue, ' ', kt.tableName)
    END AS tableName,
    DATE_FORMAT(oh.orderTime, '%a, %h:%i %p') AS time_only,
    -- add any other non-aggregated columns you need from oh.*
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'name', ki.itemName,
            'qty', od.quantity,
            'prepStatus', od.prepStatus
        )
    ) AS services
FROM 
    kt_orderHeader oh
JOIN 
    kt_orderDetails od ON oh.orderId = od.orderId
JOIN 
    kt_items ki ON od.itemId = ki.itemId
LEFT JOIN 
    kt_tables kt ON oh.tableId = kt.tableId
LEFT JOIN 
    kt_masterMapping km ON kt.areaId = km.id
WHERE 
     oh.kitchenId = ?
    AND oh.delFlag = 0
GROUP BY 
    oh.orderId, oh.kitchenId, oh.orderTime
    HAVING 
     MIN( od.prepStatus ) <> 2 or min(od.prepStatus) is null
    ORDER BY oh.orderId;
`,
    [kitchenId]
  );

  return rows;
};
const getTableStatus = async (kitchenId, table) => {
  const [rows] = await db.query(
    `
    select * from kt_orderHeader
    where kitchenId = ?
    and tableId = ?
    and status = 0
    and delFlag=0;
`,
    [kitchenId, table]
  );

  return rows;
};
const getTableDetails = async (kitchenId) => {
  const [rows] = await db.query(
    `
    SELECT 
    m.mapValue AS areaName,
    t.tableId AS id,
    t.tableName AS name,
    t.tableCapacity AS seats,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM kt_orderHeader o 
            WHERE o.tableId = t.tableId 
            and o.kitchenId = m.kitchenId
            AND o.status = 0 
            AND o.delFlag = 0
        ) THEN 1
        ELSE 0
    END AS occupied,
    'table' AS type
    FROM 
        kt_tables t
    JOIN 
        kt_masterMapping m ON t.areaId = m.id
    WHERE 
        m.mapType = 'DiningArea'
        AND m.kitchenId = ?
        AND m.delFlag = 0
    UNION ALL
    SELECT 
       m.mapValue,
       t.tableId AS id,
    t.tableName AS name,
    t.tableCapacity AS seats,0,0
       from kt_tables t
		JOIN 
        kt_masterMapping m ON t.areaId = m.id
		and m.mapValue= 'TakeAway'
		and m.mapType = 'DiningArea'
		where t.kitchenId =?
    `,
    [kitchenId, kitchenId]
  );

  return rows;
};

module.exports = {
  getKitchen,
  getKitchenById,
  insertKitchen,
  updateKitchenDetails,
  updateDefaultDiscount,
  updateLogo,
  getKitchenBySecret,
  getPendingUserApproval,
  getKitchenCounters,
  getPaymentOptions,
  deletePaymentOption,
  addPaymentOption,
  getRevenue,
  getLatestOrders,
  getTableStatus,
  getTableDetails,
  getExpense,
  getDefaultDiscount,
  getTaxDetails,
  getPendingOrders,
};
