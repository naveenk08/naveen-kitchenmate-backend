const OrderModel = require("../models/orderModel");
const KitchenModel = require("../models/kitchenModel");

const {
  sendOrderConfirmation,
  sendOrderInvoice,
} = require("../services/newSendEmail");

const { sendMessageToAll } = require("../services/pusherService");
const { expenseModel } = require("../models/expenseModel");

exports.getAllActiveOrders = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await OrderModel.getAllActiveOrders(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.showRecentOrders = async (req, res, next) => {
  const id = req.params.id;

  try {
    const data = await OrderModel.showRecentOrders(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.showOrders = async (req, res, next) => {
  const { id, date } = req.params;
  try {
    const data = await OrderModel.getOrdersByKitchenId(id, date);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOrderHeaderById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const data = await OrderModel.getOrderHeaderById(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getOrdersForKitchen = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await OrderModel.getOrdersForKitchen(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.checkActiveTableOrder = async (req, res, next) => {
  const { kitchenId, tableId } = req.params;

  try {
    const data = await OrderModel.checkActiveTableOrder(kitchenId, tableId);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.resetOrderSequence = async (req, res, next) => {
  const { kitchenId } = req.body;

  try {
    const data = await OrderModel.resetOrderSequence(kitchenId);

    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.pendingOrders = async (req, res, next) => {
  const { kitchenId } = req.params;

  try {
    const data = await OrderModel.getPendingOrders(kitchenId);

    res.json(data);
  } catch (err) {
    next(err);
  }
};


exports.changePayment = async (req, res, next) => {
  const { orderId, paymentId, splitPayments, amount } = req.body;
  try {
    const data = await OrderModel.changePayment(orderId, paymentId);
    if (paymentId == 0 && splitPayments) {
      for (const payment of splitPayments) {
        await OrderModel.addPayment(orderId, payment.methodId, payment.amount);
      }
    } else {
      await OrderModel.addPayment(orderId, paymentId, amount);
    }
    if (data.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  const data = req.body;

  const { id, userId, userType } = data;
  try {
    const data = await OrderModel.deleteOrder(id, userId, userType);

    if (data.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.deleteOrderItem = async (req, res, next) => {
  const data = req.body;

  const { itemId, orderId } = data;
  try {
    const data = await OrderModel.deleteOrderItem(itemId, orderId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetailsById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await OrderModel.getOrderDetailsById(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.newOrder = async (req, res, next) => {
  const data = req.body;
  const {
    userId,
    billName,
    billContact,
    billEmail,
    kitchenId,
    status,
    table,
    packingRate,
    paymentMethod,
    splitPayments,
    discount,
    tax,
    served,
    items,
  } = data;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const netAmount = totalAmount - discount + packingRate;

  const maxOrderResult = await OrderModel.getMaxOrderNum(kitchenId);
  const maxOrder = maxOrderResult[0].max_order;

  const newOrderNum = await OrderModel.getNextOrderNum(kitchenId);

  try {
    const result = await OrderModel.newOrderHeader(
      newOrderNum,
      kitchenId,
      userId,
      billName,
      billContact,
      billEmail,
      table,
      packingRate,
      totalItems,
      status,
      totalAmount,
      discount,
      tax,
      netAmount,
      1//paymentMethod
    );
    if (result) {
      const { insertId: orderId, orderNum, orderTime } = result;

      // Insert order details
      await Promise.all(
        data.items.map(async (item) => {
          await OrderModel.newOrderDetail(
            orderId,
            kitchenId,
            item.itemid,
            userId,
            item.quantity,
            item.itemRate,
            item.totalAmount,
            served
          );
        })
      );

    
        if (paymentMethod == 0 && splitPayments) {
          for (const payment of splitPayments) {
            await OrderModel.addPayment(
              orderId,
              payment.methodId,
              payment.amount
            );
          }
        } else {
          await OrderModel.addPayment(orderId, paymentMethod, netAmount);
        }
      
      const kitchenData = await KitchenModel.getKitchenById(kitchenId);

      // if (kitchenData[0].sub_level > 1) {
      //   const messageStatus = await sendMessageToAll(kitchenId);
      // }

      // const orderData = await OrderModel.getOrderDetailsPDF(orderId);

      // const sendPDF = sendOrderInvoice(orderData);

      const orderDet = await OrderModel.getOrderHeaderById(orderId);

      return res.status(201).json({
        success: true,
        message: "Order Inserted successfully",
        orderId,
        orderNum,
        date: orderDet.dateString,
        orderTime,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to add order" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.saveOrder = async (req, res, next) => {
  try {
    const data = req.body;

    let {
      orderId,
      userId,
      billName,
      billContact,
      billEmail,
      kitchenId,
      status,
      table,
      packingRate,
      paymentMethod,
      served,
      items,
    } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid items array" });
    }

    const totalItems = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.totalAmount || 0),
      0
    );

    let result;

    const kitchenDetail = await KitchenModel.getKitchenById(kitchenId);

    const { name, addr1, sub_level } = kitchenDetail;

    if (orderId) {
      result = await OrderModel.saveOrder(
        orderId,
        totalItems,
        totalAmount,
        packingRate
      );
    } else {
      const newOrderNum = await OrderModel.getNextOrderNum(kitchenId);

      result = await OrderModel.newOrderHeader(
        newOrderNum,
        kitchenId,
        userId,
        billName,
        billContact,
        billEmail,
        table,
        packingRate,
        totalItems,
        status,
        totalAmount,
        null,
        null,
        totalAmount + packingRate,
        0//paymentMethod
      );

      if (result?.insertId) {
        orderId = result.insertId;

        // if (billEmail) {
        //   const orderDetails = {
        //     orderId: (maxOrder + 1).toString().padStart(4, "0"),
        //     kitchenName: name,
        //     kitchenAddr: addr1,
        //   };

        //   emailStatus = sendOrderConfirmation(billEmail, orderDetails);
        // }
      }
    }

    await Promise.all(
      data.items.map(async (item) => {
        await OrderModel.newOrderDetail(
          orderId,
          kitchenId,
          item.itemid,
          userId,
          item.quantity,
          item.itemRate,
          item.totalAmount,
          served
        );
      })
    );

    // if (sub_level > 1) {
    //   const messageStatus = await sendMessageToAll(kitchenId);
    // }

    const orderNum = await OrderModel.getOrderHeaderById(orderId);

    res.status(200).json({
      success: true,
      orderId,
      orderNum: orderNum.orderNum,
      date: orderNum.dateString,
      message: "Order saved successfully",
    });
  } catch (err) {
    console.error("Error saving order:", err);
    next(err);
  }
};

exports.markOrderPaid = async (req, res, next) => {
  const data = req.body;

  const {
    orderId,
    paymentMethod,
    splitPayments,
    discount,
    netAmount,
    packingCharge,
    billName,
    billEmail,
    billContact,
    tax
  } = data;

  try {
    // Call the model function to execute the SQL query
    const result = await OrderModel.markOrderPaid(
      orderId,
      paymentMethod,
      discount,
      netAmount,
      packingCharge,
      billName,
      billEmail,
      billContact,
      tax
    );

    if (paymentMethod == 0 && splitPayments) {
      for (const payment of splitPayments) {
        await OrderModel.addPayment(orderId, payment.methodId, payment.amount);
      }
    } else {
      await OrderModel.addPayment(orderId, paymentMethod, netAmount);
    }

    if (result.affectedRows > 0) {
      // const orderData = await OrderModel.getOrderDetailsPDF(orderId);

      // const sendPDF = sendOrderInvoice(orderData);

      return res.status(200).json({ success: true, message: "Order Paid" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Failed to Update order to paid" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getReportData = async (req, res) => {
  try {
    const { type, kitchenId } = req.query;

    if (!type) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters" });
    }

    const salesData = await OrderModel.getSalesData(type, kitchenId);

    const paymentData = await OrderModel.getPaymentData(type, kitchenId);

    res.json({ sales: salesData, paymentData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getItemWiseReport = async (req, res) => {
  try {
    const { kitchenId, date, endDate, type } = req.query;

    if (!kitchenId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters" });
    }

    const itemWiseData = await OrderModel.getItemWiseSales(
      kitchenId,
      date,
      endDate
    );
    const completeData = await OrderModel.getAllSalesForDay1(
      kitchenId,
      date,
      endDate
    );
    const summaryData = await OrderModel.getDaysSummary(
      kitchenId,
      date,
      endDate
    );
    const expenseData = await expenseModel.getDaysExpense(
      kitchenId,
      date,
      endDate
    );
    const paymentData = await OrderModel.getDaysPaymentSummary(
      kitchenId,
      date,
      endDate
    );
    const customerData = await OrderModel.customerData(
      kitchenId,
      date,
      endDate
    );
    const expenseDetails = await expenseModel.getExpenseDetail(
      kitchenId,
      date,
      endDate
    );

    let graphData;

    if (type == 0)
      graphData = await OrderModel.graphDataDay(kitchenId, endDate);
    else graphData = await OrderModel.graphDataMonth(kitchenId, date);

    res.json({
      itemWiseData: itemWiseData,
      completeData: completeData,
      summaryData: summaryData,
      paymentData: paymentData,
      expenseData,
      customerData,
      expenseDetails,
      graphData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDailyDiscounts = async (req, res) => {
  try {
    const { kitchenId, date } = req.query;

    if (!kitchenId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters" });
    }

    const dailyDiscount = await OrderModel.dailyDiscounts(kitchenId, date);
    res.json(dailyDiscount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePrepStatus = async (req, res, next) => {
  const { orderId, status } = req.body;

  try {
    const data = await OrderModel.updatePrepStatus(orderId, status);

    if (data.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "failed to update" });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  const data = req.body;

  try {
    const response = await OrderModel.updateOrder(data);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
