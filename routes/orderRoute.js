const express = require("express");
const OrderController = require("../controllers/orderController");
const router = express.Router();

router.get("/activeOrder/:id", OrderController.getAllActiveOrders);
router.get("/showOrders/:id/:date", OrderController.showOrders);
router.get("/getOrder/:id", OrderController.getOrderDetailsById);
router.get("/getOrderHeader/:id", OrderController.getOrderHeaderById);
router.post("/newOrder", OrderController.newOrder);
router.post("/saveOrder", OrderController.saveOrder);
router.put("/markpaid", OrderController.markOrderPaid);
router.get("/sales-report", OrderController.getReportData);
router.get("/itemwise-report", OrderController.getItemWiseReport);
router.get("/dailyDiscount", OrderController.getDailyDiscounts);
router.put("/deleteOrder", OrderController.deleteOrder);
router.put("/changePayment", OrderController.changePayment);
router.get("/getOrdersForKitchen/:id", OrderController.getOrdersForKitchen);
router.put("/updatePrepStatus", OrderController.updatePrepStatus);
router.put("/updatePrepStatus", OrderController.updatePrepStatus);
router.put("/deleteOrderItem", OrderController.deleteOrderItem);
router.post("/updateOrder", OrderController.updateOrder);
router.get("/checkActiveTableOrder/:kitchenId/:tableId", OrderController.checkActiveTableOrder);



module.exports = router;
