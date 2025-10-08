const db = require("../config/db");
const generateSignedUrl = require("../services/getSignedUrl");


const expenseModel = {
  getExpenseCategory: async (id) => {
    const sql = `SELECT id, mapValue FROM kt_masterMapping 
    WHERE delFlag=0 and kitchenId in (0,?) AND mapType = 'ExpenseCategory';`;
    const [result] = await db.execute(sql,[id]);

    return result;
  },
  getExpensePayments: async (id) => {
    const sql = `SELECT id, mapValue FROM kt_masterMapping 
    WHERE delFlag=0 and kitchenId in (0,?) and mapType = 'ExpensePayment';`;
    const [result] = await db.execute(sql,[id]);

    return result;
  },
  newExpense: async (
    user,
    kitchen,
    type,
    paymentType,
    amount,
    description,
    date
  ) => {
    const sql = `insert into kt_expenses (kitchenId, userId, expenseCat, expensePayment, expenseAmount, expenseDate, expenseDesc,updateTime)
 values (?, ?, ?, ?, ?, STR_TO_DATE(?, '%Y-%m-%d'), ? ,sysdate())`;
    const [result] = await db.execute(sql, [
      kitchen,
      user,
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
        select e.expenseId, e.kitchenId, e.userId, m1.mapValue type, m2.mapValue payment, e.expenseAmount, e.expenseDate,
        date_format(e.expenseDate,'%d %M %Y') formattedDate, e.expenseDesc, e.attachment, e.updateTime
        from kt_expenses e
        join kt_masterMapping m1 on e.expenseCat = m1.id and m1.mapType = 'ExpenseCategory'
        join kt_masterMapping m2 on e.expensePayment = m2.id and m2.mapType = 'ExpensePayment'
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

  getDaysExpense: async(kitchen, date,endDate) =>{
     const sql = `select km.id, km.mapValue name, sum(expenseAmount) amount
        from kt_expenses ke, kt_masterMapping km
        where ke.expenseCat = km.id
        and date(expenseDate) between ? and ?
        and ke.kitchenId = ?
        group by km.id, km.mapValue;`;
    const [result] = await db.execute(sql, [date,endDate,kitchen]);
    return result;
  },
  getExpenseDetail: async(kitchen, date,endDate) =>{
     const sql = `select km.id, km.mapValue category, km2.mapValue payment, ke.expenseAmount amount, 
date_format(ke.expenseDate,'%d %M %Y') date
        from kt_expenses ke
        join kt_masterMapping km on ke.expenseCat = km.id and km.mapType='ExpenseCategory'
        join kt_masterMapping km2 on ke.expensePayment = km2.id and km2.mapType= 'ExpensePayment'
        and date(expenseDate) between ? and ?
        and ke.kitchenId = ?;`;
    const [result] = await db.execute(sql, [date,endDate,kitchen]);
    return result;
  }
};

module.exports = { expenseModel };