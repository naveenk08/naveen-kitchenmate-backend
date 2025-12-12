const db = require("../config/db");
const generateSignedUrl = require("../services/getSignedUrl");

const expenseModel = {
  getExpenseCategory: async (id) => {
    const sql = `SELECT a.id, a.mapValue, 
JSON_ARRAYAGG(
    JSON_OBJECT(
        'id', b.id,
        'type', b.mapDesc
    )
) AS types
FROM kt_masterMapping a
LEFT JOIN kt_masterMapping b ON b.mapValue = a.id AND b.mapType = 'ExpenseType'
WHERE a.mapType = 'ExpenseCategory'
AND a.kitchenId IN (0, ?)
AND b.kitchenId IN (0, ?)
GROUP BY a.id, a.mapValue;`;

    const [result] = await db.execute(sql, [id, id]);
    return result;
  },
  getExpensePayments: async (id) => {
    const sql = `SELECT id, mapValue FROM kt_masterMapping 
    WHERE delFlag=0 and kitchenId in (0,?) and mapType = 'ExpensePayment';`;
    const [result] = await db.execute(sql, [id]);

    return result;
  },
  newExpense: async (
    user,
    kitchen,
    category,
    type,
    paymentType,
    amount,
    description,
    date
  ) => {
    const sql = `insert into kt_expenses (kitchenId, userId, expenseCat,expenseType, expensePayment, expenseAmount, expenseDate, expenseDesc,updateTime)
 values (?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%Y-%m-%d'), ? ,sysdate())`;
    const [result] = await db.execute(sql, [
      kitchen,
      user,
      category,
      type,
      paymentType,
      amount,
      date,
      description,
    ]);
    return result.insertId;
  },
  updateAttachment: async (url, expenseId) => {
    const sql = `update kt_expenses set attachment = ? where expenseId = ?`;
    const [result] = await db.execute(sql, [url, expenseId]);
    return result.affectedRows;
  },
  getExpenseByMonth: async (kitchen, month, year) => {
    const sql = `
        select e.expenseId, e.kitchenId, e.userId, m1.mapValue category, m2.mapValue payment, ifnull(m3.mapDesc,'Unknown') type,
        e.expenseAmount, e.expenseDate,
        date_format(e.expenseDate,'%d %M %Y') formattedDate, e.expenseDesc, e.attachment, e.updateTime
        from kt_expenses e
        join kt_masterMapping m1 on e.expenseCat = m1.id and m1.mapType = 'ExpenseCategory'
        join kt_masterMapping m2 on e.expensePayment = m2.id and m2.mapType = 'ExpensePayment'
        left join kt_masterMapping m3 on e.expenseType = m3.id and m3.mapType = 'ExpenseType'
        where e.kitchenId = ?
        and month(expenseDate) = ?
        and year(expenseDate) = ?
        order by expenseDate desc, expenseId desc
    `;
    const [result] = await db.execute(sql, [kitchen, month, year]);

    const updatedRows = await Promise.all(
      result.map(async (expense) => ({
        ...expense,
        attachmentSigned: expense.attachment
          ? await generateSignedUrl(expense.attachment)
          : null,
      }))
    );

    return updatedRows;
  },
  deleteExpense: async (expense) => {
    const sql = `delete from kt_expenses where expenseId = ?`;
    const [result] = await db.execute(sql, [expense]);
    return result;
  },

  getDaysExpense: async (kitchen, date, endDate) => {
    const sql = `select km.id, km.mapValue name,km2.mapDesc type, sum(expenseAmount) amount
        from kt_expenses ke, kt_masterMapping km, kt_masterMapping km2
        where ke.expenseCat = km.id
        and ke.expenseType = km2.id
        and km2.mapValue = km.id
        and km2.mapType = 'ExpenseType'
        and km.mapType = 'ExpenseCategory'
        and date(expenseDate) between ? and ?
        and ke.kitchenId = ?
        group by km.id, km.mapValue,km2.mapDesc
order by km.id, km2.mapDesc;
`;
    const [result] = await db.execute(sql, [date, endDate, kitchen]);
    return result;
  },
  getExpenseDetail: async (kitchen, date, endDate) => {
    const sql = `select km.id, km.mapValue category, km3.mapDesc type, km2.mapValue payment, ke.expenseAmount amount, 
date_format(ke.expenseDate,'%d-%m-%Y') date
        from kt_expenses ke
        join kt_masterMapping km on ke.expenseCat = km.id and km.mapType='ExpenseCategory'
        join kt_masterMapping km2 on ke.expensePayment = km2.id and km2.mapType= 'ExpensePayment'
        join kt_masterMapping km3 on ke.expenseType = km3.id and km3.mapType= 'ExpenseType'
        and date(expenseDate) between ? and ?
        and ke.kitchenId = ?;`;
    const [result] = await db.execute(sql, [date, endDate, kitchen]);
    return result;
  },
};

module.exports = { expenseModel };
