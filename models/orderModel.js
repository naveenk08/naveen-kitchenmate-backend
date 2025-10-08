const { routes } = require("../app");
const db = require("../config/db");
const moment = require("moment-timezone");
const generateSignedUrl = require("../services/getSignedUrl");
require("dotenv").config();

const getAllActiveOrders = async (id) => {
  const [rows] = await db.query(
    `SELECT 
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
            'qty', od.quantity
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
    oh.status = 0 
    AND oh.kitchenId = ?
GROUP BY 
    oh.orderId, oh.kitchenId, oh.orderTime
    ORDER BY oh.orderId;`,
    [id]
  );
  return rows;
};

const getOrdersByKitchenId = async (id, date) => {
  let query = `SELECT 
    oh.orderId,
    oh.orderNum,
    oh.billName,
    oh.kitchenId,
    oh.orderTime,
    (
        SELECT GROUP_CONCAT(
          km.mapValue SEPARATOR ', '
        )
        FROM kt_paymentInfo pi
        JOIN kt_masterMapping km ON pi.paymentType = km.id
        WHERE pi.invoiceId = oh.orderId
    ) AS paymentMethod,
    oh.net_amount,
    CASE 
        WHEN oh.tableId = 0 THEN 'Parcel'
        ELSE CONCAT(km.mapValue, ' ', kt.tableName)
    END AS tableName,
    DATE_FORMAT(oh.orderTime, '%a, %h:%i %p') AS time_only,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'name', ki.itemName,
            'qty', od.quantity
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
    oh.status = 1
    AND oh.delFlag = 0
    AND oh.kitchenId = ?
    AND DATE(oh.orderTime) = CURDATE()
GROUP BY 
    oh.orderId, oh.kitchenId, oh.orderTime
ORDER BY 
    oh.orderId DESC;`;
  let values = [id];

  const [rows] = await db.query(query, values);
  return rows;
};

const getOrderDetailsById = async (id) => {
  const [rows] = await db.query(
    `select ko.odId,ki.itemid ,ki.itemName ,ki.itemRate  ,ko.quantity,ko.totalAmount, kc.mapValue counterName, kc.mapDesc printerName
    from kt_orderDetails ko,kt_items ki , kt_masterMapping kc
    where ko.itemId = ki.itemid 
    and ki.prepKitchen = kc.id
    and ko.orderId=?`,
    [id]
  );
  return rows;
};

const getOrderHeaderById = async (id) => {
  try{
  const [rows] = await db.query(
    `select oh.*,DATE_FORMAT(orderTime, '%a, %d %M %I:%i %p') AS dateString, 
    CASE 
        WHEN oh.tableId = 0 THEN 'Parcel'
        ELSE CONCAT(km.mapValue, ' ', kt.tableName)
    END AS tableName,
    (
        SELECT GROUP_CONCAT(
            concat(km.mapValue, ' (', pi.paymentAmount,')') SEPARATOR ', '
        )
        FROM kt_paymentInfo pi
        JOIN kt_masterMapping km ON pi.paymentType = km.id
        WHERE pi.invoiceId = oh.orderId
    ) AS paymentMethod
    from kt_orderHeader oh 
    LEFT JOIN 
    kt_tables kt ON oh.tableId = kt.tableId
LEFT JOIN 
    kt_masterMapping km ON kt.areaId = km.id
    where orderId=?`,
    [id]
  );
  
  return rows[0];
}
  catch(err){
    log(err)
  }
};

const checkActiveTableOrder = async (kitchenId, tableId) => {
  const [rows] = await db.query(
    `select * from kt_orderHeader where kitchenId=? and tableId = ? and status = 0`,
    [kitchenId, tableId]
  );
  return rows[0];
};

const getOrdersForKitchen = async (id) => {
  const [rows] = await db.query(
    `SELECT 
    oh.orderId,
    oh.orderNum,
    oh.kitchenId,
    oh.tableId,
    oh.net_amount,
    oh.items totItems,
    DATE_FORMAT(max(od.updateTime),  '%a, %l:%i %p') AS dateString,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'odId', od.odId,
            'orderId', od.orderId,
            'itemId', od.itemId,
            'ItemName',ki.itemName ,
            'quantity', od.quantity,
            'prevQty', od.prevQty,
            'totalAmount', od.totalAmount,
            'prepStatus', od.prepStatus
        )
    ) AS items
FROM kt_orderHeader oh
LEFT JOIN kt_orderDetails od ON oh.orderId = od.orderId
inner join kt_items ki on od.itemId = ki.itemid 
WHERE oh.kitchenId = ? 
and oh.status = 0
and (od.prepStatus is NULL or od.prepStatus <> 2)
GROUP BY oh.orderId
order by oh.orderId;`,
    [id]
  );
  return rows;
};

const changePayment = async (orderId, paymentId) => {
  const sql = `update kt_orderHeader set paymentType = ${paymentId} where orderId = ${orderId}`;
  const [rows] = await db.query(sql);

  const sql1 = 'delete from kt_paymentInfo where invoiceId= ?'
    const [rows1] = await db.query(sql1,[orderId]);

  return rows;
};

const updatePrepStatus = async (orderId, status) => {
  const sql = `update kt_orderDetails set prepStatus = ${status} 
  where orderId = ${orderId} and (prepStatus < ${status} or prepStatus is NULL)`;

  const [rows] = await db.query(sql);
  return rows;
};

const deleteOrder = async (id, userId, userType) => {
  let sql = "";
  if (userType != 2) {
    sql = `update kt_orderHeader set delFlag=2, delUser = ${userId}, delApprUser=${userId} 
    where orderId = ${id}`;
  } else {
    sql = `update kt_orderHeader set delFlag=1, delUser = ${userId} 
    where orderId = ${id}`;
  }
  const [rows] = await db.query(sql);

  return rows;
};

const deleteOrderItem = async (itemId, orderId) => {
  let sql = `delete from kt_orderDetails where itemId = ? and orderId = ?`;
  const [rows] = await db.query(sql, [itemId, orderId]);

  if (rows.affectedRows > 0) {
    sql = `select sum(quantity) qty, sum(totalAmount) total from kt_orderDetails
            where orderId = ?`;

    const [rows] = await db.query(sql, [orderId]);

    const { qty, total } = rows[0];

    sql = `update kt_orderHeader set items = ?, amount = ?, net_amount = ? 
            where orderId = ?`;

    const [data] = await db.query(sql, [qty, total, total, orderId]);

    if (data.affectedRows > 0) {
      return { success: true, message: "Item deleted successfully !" };
    } else {
      return { success: false, message: "Failed to Delete Item!" };
    }
  }

  return { success: false, message: "Item not found to delete !" };
};

const getMaxOrderNum = async (id) => {
  const [rows] = await db.query(
    "SELECT ifnull(max(orderNum),0) max_order FROM kt_orderHeader where kitchenId=?",
    [id]
  );

  return rows;
};

const newOrderHeader = async (
  orderNum,
  kitchenId,
  userId,
  billName,
  billContact,
  billEmail,
  tableId,
  packingRate,
  items,
  status,
  amount,
  discount,
  net_amount,
  paymentMethod
) => {
  const query = `INSERT INTO kt_orderHeader (orderNum,kitchenId,userId,billName,billContact,billEmail,tableId,
  items,status,amount,discount,packingCharge,net_amount,paymentType,delFlag,orderTime) 
  VALUES (?,?,?, ?,?, ?,?, ?, ?, ?, ?, ?, ?, ?,0, SYSDATE())`;
  const [result] = await db.query(query, [
    orderNum,
    kitchenId,
    userId,
    billName,
    billContact,
    billEmail,
    tableId,
    items,
    status,
    amount,
    discount,
    packingRate,
    net_amount,
    paymentMethod,
  ]);

  if (result.insertId) {
    // Fetch orderTime for the inserted row
    const [rows] = await db.query(
      `SELECT orderNum,DATE_FORMAT(orderTime, '%d-%m-%Y %I:%i %p') orderTime FROM kt_orderHeader WHERE orderId = ?`,
      [result.insertId]
    );

    return {
      insertId: result.insertId,
      orderNum: rows[0].orderNum,
      orderTime: rows[0].orderTime,
    };
  }

  return null;
};

const saveOrder = async (orderId, totalItems, totalAmount, packingRate) => {

  const query = `update kt_orderHeader koh set items = items+?, amount=amount+?, packingCharge= packingCharge+?, net_amount=net_amount+? where koh.orderId =? `;
  const [result] = await db.query(query, [
    totalItems,
    totalAmount,
    packingRate,
    totalAmount + packingRate,
    orderId,
  ]);
  return result;
};

const newOrderDetail = async (
  orderId,
  kitchenId,
  itemId,
  userId,
  quantity,
  rate,
  totalAmount
) => {
  // Check if the item already exists in the order
  const checkQuery = `SELECT quantity, totalAmount, prepStatus, prevQty FROM kt_orderDetails WHERE orderId = ? AND itemId = ?`;
  const [existingRows] = await db.query(checkQuery, [orderId, itemId]);

  if (existingRows.length > 0) {
    // If item exists, increment the quantity and update totalAmount
    const newQuantity = existingRows[0].quantity + quantity;
    const newTotalAmount = existingRows[0].totalAmount + totalAmount;
    const prepStatus = existingRows[0].prepStatus;

    const prevQtyValue =
      prepStatus === 2 ? existingRows[0].quantity : existingRows[0].prevQty;

    const updateQuery = `UPDATE kt_orderDetails 
                         SET quantity = ?, prevQty = ?, totalAmount = ?, prepStatus = NULL, updateTime = SYSDATE() 
                         WHERE orderId = ? AND itemId = ?`;
    await db.query(updateQuery, [
      newQuantity,
      prevQtyValue,
      newTotalAmount,
      orderId,
      itemId,
    ]);
    return { updated: true, orderId, itemId, newQuantity, newTotalAmount };
  } else {
    // If item does not exist, insert a new record
    const insertQuery = `INSERT INTO kt_orderDetails (orderId, kitchenId, itemId, userId, quantity, rate, totalAmount, updateTime) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, SYSDATE())`;
    await db.query(insertQuery, [
      orderId,
      kitchenId,
      itemId,
      userId,
      quantity,
      rate,
      totalAmount,
    ]);
    return { inserted: true, orderId, itemId, quantity, totalAmount };
  }
};

const markOrderPaid = async (
  orderId,
  paymentMethod,
  discount,
  netAmount,
  packingCharge,billName,billEmail,billContact
) => {
  const query = `UPDATE kt_orderHeader SET status = 1,paymentType=?,discount=?,net_amount=?,packingCharge=?,  
                 billName=?, billContact=?,billEmail=? WHERE orderId = ?`;
  const [result] = await db.query(query, [
    paymentMethod,
    discount,
    netAmount,
    packingCharge,
    billName,billContact,billEmail,
    orderId,
  ]);
  return result;
};

const getSalesData = async (type, kitchenId) => {
  let sql = "";

  if (type === "daily") {
    sql = `WITH DateSeries AS (
    SELECT DATE(CURRENT_DATE() - INTERVAL seq DAY) AS date
    FROM (SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
          UNION SELECT 5 UNION SELECT 6) AS seq_table
)
SELECT 
    d.date, 
    DATE_FORMAT(d.date, '%a')  AS value, 
    COALESCE(SUM(CAST(k.net_amount AS DECIMAL(10,2))), 0) AS totalAmount
FROM DateSeries d
LEFT JOIN kt_orderHeader k 
    ON DATE(k.orderTime) = d.date
and k.kitchenId=${kitchenId}
and k.delFlag=0
and k.status=1
and k.paymentType is not null
GROUP BY d.date
ORDER BY d.date ASC;`;
  } else if (type === "weekly") {
    sql = `WITH WeekSeries AS (
    SELECT 
        DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL seq WEEK), '%Y%u') AS week,
        DATE_SUB(CURRENT_DATE(), INTERVAL seq WEEK) - INTERVAL (WEEKDAY(DATE_SUB(CURRENT_DATE(), INTERVAL seq WEEK))) DAY AS start_date
    FROM (SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) AS seq_table
)
SELECT 
    ws.week, 
    DATE_FORMAT(ws.start_date, '%d/%m') AS value,
    COALESCE(SUM(CAST(k.net_amount AS DECIMAL(10,2))), 0) AS totalAmount
FROM WeekSeries ws
LEFT JOIN kt_orderHeader k 
    ON YEARWEEK(k.orderTime, 1) = ws.week
    AND k.kitchenId = ${kitchenId}
    and k.delFlag=0
    and k.status=1
    and k.paymentType is not null
GROUP BY ws.week, ws.start_date
ORDER BY ws.week asc;
`;
  } else if (type === "monthly") {
    sql = `WITH MonthSeries AS (
    SELECT 
        DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL seq MONTH), '%Y-%M') AS month,
        DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL seq MONTH), '%Y-%m') AS start_date,
        DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL seq MONTH), '%b %y') AS value
    FROM (SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) AS seq_table
)
SELECT 
    ms.month, 
--     ms.start_date,
    ms.value,
    COALESCE(SUM(CAST(k.net_amount AS DECIMAL(10,2))), 0) AS totalAmount
FROM MonthSeries ms
LEFT JOIN kt_orderHeader k 
    ON DATE_FORMAT(k.orderTime, '%Y-%M') = ms.month
and k.kitchenId=${kitchenId}
and k.delFlag=0
and k.status =1
and k.paymentType is not null
GROUP BY ms.month, ms.start_date,ms.value
ORDER BY ms.start_date ASC;`;
  }

  

  try {
    const [rows] = await db.execute(sql);

    return rows;
  } catch (error) {
    throw new Error("Error fetching sales data: " + error.message);
  }
};

const getPaymentData = async (type, kitchenId) => {
  const IST = "Asia/Kolkata";
  let level = "";

  if (type == "daily") {
    level = 'CURDATE()'
  } else if (type == "monthly") {
    level = `DATE_FORMAT(CURDATE(), '%Y-%m-01 00:00:00')`
  } else {
    level = 'DATE_SUB(CURDATE(), INTERVAL (WEEKDAY(CURDATE())) DAY)'
  }

  const paymentQuery = `
        SELECT kp.paymentType,po.mapValue optionName, SUM(kp.paymentAmount) AS total
      FROM kt_orderHeader oh, kt_paymentInfo kp ,kt_masterMapping po
      WHERE oh.orderId = kp.invoiceId
      and kp.paymentType = po.id
      and orderTime > ${level}
      and oh.kitchenId =  ${kitchenId}
      and oh.delFlag=0
      and status =1
      and oh.paymentType is not null
      GROUP BY kp.paymentType,po.mapValue
    `;

  try {
    const [rows] = await db.execute(paymentQuery);

    return rows;
  } catch (error) {
    throw new Error("Error fetching sales data: " + error.message);
  }
};

const getItemWiseSales = async (kitchenId, date, endDate) => {
  const query = `

  
select ki.itemName ,kc.mapValue catName,sum(kod.quantity),sum(kod.totalAmount)
from kt_orderHeader koh ,
kt_orderDetails kod ,
kt_items ki ,kt_masterMapping kc
where koh.orderId = kod.orderId 
and kod.itemId = ki.itemid 
and ki.itemCategory = kc.id and kc.mapType = 'Category'
and date(koh.orderTime) between '${date}' and '${endDate}'
and koh.kitchenId = ${kitchenId}
and koh.delFlag=0
and koh.status=1
group by ki.itemName,kc.mapValue
;`;

  const [rows] = await db.query(query);

  return rows;
};

const getAllSalesForDay = async (kitchenId, date) => {
  const query = `SELECT 
    LPAD(koh.orderNum, 4, '0') AS 'Order#',
    ki.itemName AS 'Item',
    kod.quantity AS 'Qty',
    kod.rate AS 'Rate',
    kod.totalAmount AS 'Total Amount',
    CASE 
        WHEN kod.userId = -1 THEN 'Customer'
        ELSE CONCAT(ku.firstName, ' ', ku.lastName)
    END AS 'User',
    '' AS 'Discount',
    '' AS 'NetAmount',
    '' AS 'PaymentType',
    kod.updateTime AS 'Time'
FROM
    kt_orderHeader koh
JOIN kt_orderDetails kod ON koh.orderId = kod.orderId
JOIN kt_items ki ON kod.itemId = ki.itemid
LEFT JOIN kt_users ku ON kod.userId = ku.id
WHERE
    kod.kitchenId = ${kitchenId}
    and koh.delFlag = 0
    and koh.status = 1
    AND DATE_FORMAT(kod.updateTime, '%Y-%m-%d') = '${date}'

UNION ALL

SELECT
    LPAD(koh.orderNum, 4, '0') AS 'Order#',
    'TOTAL' AS 'Item',
    SUM(kod.quantity) AS 'Qty',
    '' AS 'Rate',
    SUM(kod.totalAmount) AS 'Total Amount',
    '' AS 'User',
    CONCAT('-', MAX(koh.discount)) AS 'Discount',
    MAX(koh.net_amount) AS 'NetAmount',
      (
        SELECT GROUP_CONCAT(
            concat(km.mapValue, ' (', pi.paymentAmount,')') SEPARATOR ', '
        )
        FROM kt_paymentInfo pi
        JOIN kt_masterMapping km ON pi.paymentType = km.id
        WHERE pi.invoiceId = koh.orderId
    ) AS paymentType,
    '' AS 'Time'
FROM kt_orderHeader koh
JOIN kt_orderDetails kod ON koh.orderId = kod.orderId
WHERE kod.kitchenId = ${kitchenId}
and koh.delFlag=0
and koh.status = 1
AND DATE_FORMAT(kod.updateTime, '%Y-%m-%d') = '${date}'
GROUP BY koh.orderNum,po.mapValue

ORDER BY \`Order#\`, FIELD(Item, 'TOTAL'), Item;`;


  const [rows] = await db.query(query);

  return rows;
};
const getAllSalesForDay1 = async (kitchenId, date,endDate) => {
  const query = `

SELECT 
    oh.orderId,
    oh.orderNum,
    DATE_FORMAT(oh.orderTime, '%d %M %Y %I:%i %p') AS dateString,
    oh.billName AS customerName,
    -- Table information
    concat(mm_table.mapValue,' ',t.tableName) as tableName,
--     mm_table.mapValue AS tableArea,
--     t.tableCapacity,
    -- Payment information
     (
        SELECT GROUP_CONCAT(
            concat(km.mapValue, ' (', pi.paymentAmount,')') SEPARATOR ', '
        )
        FROM kt_paymentInfo pi
        JOIN kt_masterMapping km ON pi.paymentType = km.id
        WHERE pi.invoiceId = oh.orderId
    ) AS paymentMethod,
    -- Order summary
    oh.items AS totalItems,
    oh.amount AS subtotal,
    oh.discount,
    oh.packingCharge,
    oh.net_amount AS totalAmount,
    -- Aggregated item details as JSON
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'itemId', od.itemId,
                'itemName', i.itemName,
                'description', i.itemDesc1,
                'quantity', od.quantity,
                'rate', od.rate,
                'total', od.totalAmount
            )
        )
        FROM kt_orderDetails od
        JOIN kt_items i ON od.itemId = i.itemId AND od.kitchenId = i.kitchenid
        WHERE od.orderId = oh.orderId 
        AND od.kitchenId = oh.kitchenId
--         AND od.delFlag = 0
    ) AS items
FROM 
    kt_orderHeader oh
-- Join with tables
LEFT JOIN kt_tables t ON oh.tableId = t.tableId and oh.kitchenId = t.kitchenId
-- Join for table area
LEFT JOIN kt_masterMapping mm_table ON t.areaId = mm_table.id 
    AND mm_table.mapType = 'DiningArea' 
WHERE
    oh.kitchenId = ?
    AND DATE(oh.orderTime) between ? and ?
    AND oh.delFlag = 0
    and oh.status=1
ORDER BY 
    oh.orderTime ASC,
    oh.orderId;`;
  const [rows] = await db.query(query,[kitchenId,date, endDate]);

  return rows;
};

const getDaysSummary = async (kitchenId, date,endDate) => {
  const query = `select sum(amount) amount,sum(net_amount) netAmount,sum(discount) discount ,
  sum(packingCharge) packingCharge,count(*) count
from kt_orderHeader koh 
where  date_format(koh.orderTime,'%Y-%m-%d') between'${date}' and '${endDate}'
and koh.kitchenId = ${kitchenId}
and status = 1
and delFlag =0
;`;

  const [rows] = await db.query(query);

  return rows[0];
};
const getDaysPaymentSummary = async (kitchenId, date,endDate) => {
  const query = `SELECT 
  po.mapValue optionName,
  SUM(kp.paymentAmount) AS amount
FROM kt_orderHeader koh, kt_paymentInfo kp, kt_masterMapping po
where koh.orderId = kp.invoiceId
and kp.paymentType = po.Id
and  DATE_FORMAT(koh.orderTime, '%Y-%m-%d') between '${date}' and '${endDate}'
  AND koh.kitchenId = ${kitchenId}
  AND koh.status = 1
  AND koh.delFlag = 0
GROUP BY po.mapValue
;`;


  const [rows] = await db.query(query);

  return rows;
};
const customerData = async (kitchenId, date,endDate) => {
  const query = `
  
SELECT 
    CASE WHEN km.mapValue = 'TakeAway' THEN kt.tableName ELSE 'DineIn' END AS tableName,
    kt.areaId,
    km.mapValue, 
    count(*) count,
    SUM(oh.net_amount) AS total_amount
FROM 
    kt_orderHeader oh,
    kt_tables kt, 
    kt_masterMapping km
WHERE 
    oh.tableId = kt.tableId
    AND oh.kitchenId = kt.kitchenId
    AND kt.areaId = km.id
    and oh.kitchenId = ?
    and oh.status=1
    and oh.delFlag=0
    AND DATE(oh.orderTime) between ? and ?
GROUP BY 
    CASE WHEN km.mapValue = 'TakeAway' THEN kt.tableName ELSE 'DineIn' END,
    kt.areaId,
    km.mapValue;
;`;


  const [rows] = await db.query(query,[kitchenId,date,endDate]);

  return rows;
};

const dailyDiscounts = async (kitchenId, date) => {
  const query = `select sum(discount) discount
from kt_orderHeader koh 
where  date_format(koh.orderTime,'%Y-%m-%d') ='${date}'
and koh.kitchenId = ${kitchenId}
;`;

  const [rows] = await db.query(query);

  return rows[0];
};
const graphDataDay = async (kitchenId, date) => {
  const query = `
SELECT 
    DATE_FORMAT(dates.DateValue, '%d/%m') AS date,
    COALESCE(SUM(CAST(oh.net_amount AS DECIMAL(10,0))), 0) AS revenue
FROM (
    SELECT DATE_SUB(DATE('${date}'), INTERVAL 4 DAY) AS DateValue
    UNION ALL SELECT DATE_SUB(DATE('${date}'), INTERVAL 3 DAY)
    UNION ALL SELECT DATE_SUB(DATE('${date}'), INTERVAL 2 DAY)
    UNION ALL SELECT DATE_SUB(DATE('${date}'), INTERVAL 1 DAY)
    UNION ALL SELECT DATE('${date}')
) dates
LEFT JOIN 
    kt_orderHeader oh ON DATE(oh.orderTime) = dates.DateValue
    AND oh.delFlag = 0
    AND oh.status = 1
    AND oh.kitchenId = ${kitchenId}
GROUP BY 
    dates.DateValue
ORDER BY 
    dates.DateValue;
;`;

  const [rows] = await db.query(query);

  return rows;
};

const graphDataMonth = async (kitchenId, date) => {
  const query = `
SELECT 
    DATE_FORMAT(months.MonthStart, '%b %y') AS date,
    COALESCE(SUM(CAST(oh.net_amount AS DECIMAL(10,0))), 0) AS revenue
FROM (
    SELECT DATE(CONCAT('${date}')) - INTERVAL 4 MONTH AS MonthStart
    UNION ALL SELECT DATE(CONCAT('${date}')) - INTERVAL 3 MONTH
    UNION ALL SELECT DATE(CONCAT('${date}')) - INTERVAL 2 MONTH
    UNION ALL SELECT DATE(CONCAT('${date}')) - INTERVAL 1 MONTH
    UNION ALL SELECT DATE(CONCAT('${date}'))
) months
LEFT JOIN kt_orderHeader oh 
    ON DATE_FORMAT(oh.orderTime, '%Y-%m-01') = months.MonthStart
    AND oh.delFlag = 0
    and oh.status = 1
    AND oh.kitchenId = ${kitchenId}
GROUP BY months.MonthStart
ORDER BY months.MonthStart;
;`;

  const [rows] = await db.query(query);

  return rows;
};

const getOrderDetailsPDF = async (orderId) => {
  const query = `SELECT 
        oh.orderId,
        oh.orderNum,
        oh.billName,
        oh.billContact,
        oh.billEmail,
        oh.amount AS subTotal,
        oh.discount,
        oh.net_amount AS total,
        k.id,
        k.name,
        k.addr1,
        od.itemId,
        i.itemName,
        od.quantity,
        od.rate AS price,
        DATE_FORMAT(oh.orderTime, '%d-%m-%Y') AS date,
        DATE_FORMAT(oh.orderTime, '%I:%i %p') AS time,
          (
        SELECT GROUP_CONCAT(
            concat(km.mapValue, ' (', pi.paymentAmount,')') SEPARATOR ', '
        )
        FROM kt_paymentInfo pi
        JOIN kt_masterMapping km ON pi.paymentType = km.id
        WHERE pi.invoiceId = oh.orderId
    ) AS paymentMethod,
        (od.quantity * od.rate) AS totalAmount
    FROM 
        kt_orderHeader oh
    JOIN 
        kt_orderDetails od ON oh.orderId = od.orderId
    JOIN 
        kt_items i ON od.itemId = i.itemid
    JOIN 
        kt_kitchens k ON oh.kitchenId = k.id
    WHERE 
        oh.orderId = ?`;

  const [rows] = await db.query(query, [orderId]);

  const order = {
    orderId: rows[0].orderId,
    orderNum: rows[0].orderNum,
    billName: rows[0].billName,
    billContact: rows[0].billContact,
    billEmail: rows[0].billEmail,
    subTotal: parseFloat(rows[0].subTotal),
    discount: parseFloat(rows[0].discount),
    total: parseFloat(rows[0].total),
    date: rows[0].date,
    time: rows[0].time,
    paymentType: paymentMethod,
    kitchenId: rows[0].id,
    kitchenName: rows[0].name,
    kitchenAddr: rows[0].addr1,
    appLogo: await generateSignedUrl(process.env.APPLOGOURL),
    items: rows.map((row) => ({
      itemId: row.itemId,
      itemName: row.itemName,
      quantity: row.quantity,
      price: parseFloat(row.price),
      totalAmount: parseFloat(row.totalAmount),
    })),
  };

  return order;
};

const addPayment= async (orderId,paymentType,amount) => {
  
    try {
      const sql = `INSERT INTO kt_paymentInfo 
                  (invoiceId, paymentType, paymentAmount) 
                  VALUES (?, ?, ?)`;
      const [result] = await db.execute(sql, [
        orderId,
        paymentType,
        amount,
      ]);
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  }

const updateOrder = async (data) => {
  try {
    const sql = `update kt_orderHeader set discount=?, packingCharge=?,  net_amount=? where orderId=?`;
    const [result] = await db.execute(sql, [
      data.discount,
      data.packingCharge,
      data.netAmount,
      data.orderId,
    ]);
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
module.exports = {
  getAllActiveOrders,
  getOrdersByKitchenId,
  getOrderDetailsById,
  newOrderHeader,
  saveOrder,
  newOrderDetail,
  markOrderPaid,
  getMaxOrderNum,
  getOrderHeaderById,
  getSalesData,
  getPaymentData,
  getItemWiseSales,
  getAllSalesForDay,
  dailyDiscounts,
  deleteOrder,
  changePayment,
  getOrdersForKitchen,
  updatePrepStatus,
  deleteOrderItem,
  getOrderDetailsPDF,
  checkActiveTableOrder,
  getDaysSummary,
  getDaysPaymentSummary,
  getAllSalesForDay1,
  addPayment,
  customerData,
  graphDataMonth,
  graphDataDay,
  updateOrder

};
