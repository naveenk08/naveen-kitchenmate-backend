const db = require("../config/db");

const accountsModel = {
  getAccountDetail: async (kitchen) => {
    try {
      const sql = `
   WITH today_data AS (
    SELECT 
        type,
        opening AS today_opening,
        closing AS today_closing
    FROM kt_accounts
    WHERE DATE(accountDate) = CURRENT_DATE()
    and kitchenId=?
),

last_entry AS (
    SELECT 
        type,
        MAX(accountDate) as last_date,
        opening,
        closing
    FROM (
        SELECT 
            a.type,
            a.accountDate,
            a.opening,
            a.closing,
            MAX(a.accountDate) OVER (PARTITION BY a.type) as max_date
        FROM kt_accounts a
        WHERE DATE(a.accountDate) < CURRENT_DATE()
        and kitchenId=?
    ) t
    WHERE accountDate = max_date
    GROUP BY type, opening, closing
),

combined_data AS (
    SELECT
        l.type,
        l.last_date,
        l.opening,
        l.closing,
        t.today_opening,
        t.today_closing
    FROM last_entry l
    LEFT JOIN today_data t ON l.type = t.type
)

SELECT
    DATE_FORMAT(MAX(last_date),'%d-%m-%Y') AS last_date,
    MAX(opening) AS max_opening,
    MAX(closing) AS max_closing,
    MAX(today_opening) AS max_today_opening,
    MAX(today_closing) AS max_today_closing,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'type', type,
            'last_date', last_date,
            'opening', opening,
            'closing', closing,
            'today_opening', today_opening,
            'today_closing', today_closing
        )
    ) AS type_details
FROM combined_data;
    `;
      const [result] = await db.execute(sql, [kitchen, kitchen]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  getAccountOpeningDetail: async (kitchen, date) => {
    try {
      const sql = `
      SELECT 
      case
        when type=1 then 'Cash'
        when type=2 then 'Account'
        else 'Unknown'
      end as 'type',
      opening,closing 
      FROM kt_accounts 
      WHERE DATE_FORMAT(accountDate, '%d-%m-%Y') = ?
      and kitchenId = ?;
    `;
      const [result] = await db.execute(sql, [date, kitchen]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  getRevenueDetail: async (kitchen, date) => {
    try {
      const sql = `

      SELECT
       SUM(CASE WHEN km.mapValue = 'Cash' THEN sp.paymentAmount ELSE 0 END) AS cash,
  SUM(CASE WHEN km.mapValue IN ('UPI', 'Card') THEN sp.paymentAmount ELSE 0 END) AS account,
  SUM(CASE WHEN km.mapValue NOT IN ('Cash', 'UPI', 'Card') THEN sp.paymentAmount ELSE 0 END) AS other
    FROM kt_orderHeader oh
    JOIN kt_paymentInfo sp ON oh.orderId = sp.invoiceId
    join kt_masterMapping km on sp.paymentType = km.id and km.mapType = 'PaymentOption'
    WHERE DATE_FORMAT(oh.orderTime, '%d-%m-%Y') = '${date}'
    and oh.delFlag=0
    and oh.kitchenId=${kitchen}
    `;

      const [result] = await db.execute(sql);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  expenseDetails: async (kitchen, date) => {
    try {
      const sql = `
SELECT 
    IFNULL(km.mapValue, 'Others') AS paymentType,
    sum(expenseAmount)
FROM kt_expenses ke
LEFT JOIN kt_masterMapping km
    ON ke.expensePayment = km.id 
    AND km.mapType = 'ExpensePayment'
      where DATE_FORMAT(expenseDate, '%d-%m-%Y') = ?
      and ke.kitchenId = ?
      GROUP BY IFNULL(km.mapValue, 'Others');
    `;
      const [result] = await db.execute(sql, [date, kitchen]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  getAdjustedDetails: async (kitchen, date) => {
    try {
      const sql = `
select * from kt_accountDetails where kitchenId=? and DATE_FORMAT(clearingDate, '%d-%m-%Y') = ?
    `;
      const [result] = await db.execute(sql, [kitchen, date]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  updateAccountClosing: async (amount, accType, kitchen, date) => {
    try {
      const sql = `
          update kt_accounts set closing = ? 
          where kitchenId= ?
          and type=?
          and DATE_FORMAT(accountDate, '%d-%m-%Y') = ?
    `;
      const [result] = await db.execute(sql, [amount, kitchen, accType, date]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  openAccountEntry: async ({ kitchen, type, opening }) => {
    try {
      const sql = `
       INSERT INTO kt_accounts (kitchenId, accountDate, type, opening, closing)
    VALUES (?, date(curdate()), ?, ?, NULL)
    `;
      const [result] = await db.execute(sql, [kitchen, type, opening]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  reopenAccount: async (date, kitchen) => {
    try {
      const sql = `
          update kt_accounts set closing = null
          where kitchenId= ?
          and DATE_FORMAT(accountDate, '%Y-%m-%d') = ?
    `;
      const [result] = await db.execute(sql, [kitchen, date]);

      return result;
    } catch (err) {
      console.log(err);
    }
  },
  getAccountStatusForDay: async (date, kitchen) => {
    const sql = `select opening, closing from kt_accounts where kitchenId = ? and DATE_FORMAT(accountDate, '%Y-%m-%d') = ?`;
    const [result] = await db.execute(sql, [kitchen, date]);

    return result;
  },
  adjustAccount: async (
    kitchen,
    user,
    date,
    transactionType,
    transactionTypeName,
    paymentMethod,
    paymentMethodName,
    amount,
    description
  ) => {
    const sql = `insert into kt_accountDetails ( kitchenId, userId, type, typeName,
    paymentMethod, paymentMethodName, amount, description, clearingDate,modifyDate) 
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, sysdate())`;
    const [result] = await db.execute(sql, [
      kitchen,
      user,
      transactionType,
      transactionTypeName,
      paymentMethod,
      paymentMethodName,
      amount,
      description,
      date,
    ]);

    return result;
  },
};

module.exports = { accountsModel };
