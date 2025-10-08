const express = require("express");
const ItemController = require("../controllers/itemController.js");

const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.get("/:id", ItemController.getItemsBykitchenId);
router.get("/getItemByCat/:kid/:cid", ItemController.getitemsByCategoryAndKitchen);
router.get("/getItemByKitchen/:kid", ItemController.getItemByKitchen);
router.get("/getItemImageByKitchen/:kid", ItemController.getItemImageByKitchen);
router.put("/updateitem/:id", ItemController.updateItem);
router.post('/addItem',upload.single('image'), ItemController.insertItem);
router.delete('/deleteItem/:id',ItemController.deleteItem);


module.exports = router;
