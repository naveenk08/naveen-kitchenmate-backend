const express = require("express");
const KitchenController = require("../controllers/kitchenController");

const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/getKitchenBySecret/:value", KitchenController.getKitchenBySecret);
router.post(
  "/addKitchen",
  upload.single("image"),
  KitchenController.insertItem
);
router.get("/getKitchenById/:id", KitchenController.getKitchenById);
router.put("/updateKitchen", KitchenController.updateKitchen);
router.get("/getPendingApprovals/:id", KitchenController.getPendingUserApproval);
router.get("/getKitchenCounters/:id", KitchenController.getKitchenCounters);
router.get("/getPaymentOptions/:id", KitchenController.getPaymentOptions);
router.get("/deletePaymentOption/:id", KitchenController.deletePaymentOption);
router.post("/addPaymentOption", KitchenController.addPaymentOption);
router.get("/getHomeScreenData/:id", KitchenController.getHomeScreenData);
router.get("/getTableStatus", KitchenController.getTableStatus);
router.get("/getTableDetails", KitchenController.getTableDetails);


module.exports = router;
