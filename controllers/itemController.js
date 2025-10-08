const multer = require("multer");
const ItemModel = require("../models/itemModel.js");
const axios = require("axios");

const uploadService = require("../services/s3Service.js");
const imageService = require("../services/getImagefromWeb.js");

exports.getItemsBykitchenId = async (req, res, next) => {
  try {
    const data = await ItemModel.getAllItemByKitchenId(req.params.id);
    if (!data) return res.status(404).json({ message: "Data not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getitemsByCategoryAndKitchen = async (req, res, next) => {
  try {
    const kitchenid = req.params.kid;
    const catId = req.params.cid;
    const data = await ItemModel.getitemsByCategoryAndKitchen(kitchenid, catId);
    if (!data) return res.status(404).json({ message: "Data not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getItemByKitchen = async (req, res, next) => {
  try {
    const kitchenid = req.params.kid;
    const data = await ItemModel.getItemByKitchen(kitchenid);
    if (!data) return res.status(404).json({ message: "Data not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getItemImageByKitchen = async (req, res, next) => {
  try {
    const kitchenid = req.params.kid;
    const data = await ItemModel.getItemImageByKitchen(kitchenid);
    if (!data) return res.status(404).json({ message: "Data not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  const id = req.params.id;
  const {
    name,
    catId,
    rate,
    packingRate,
    desc1,
    desc2,
    dailyRefresh,
    itemAvailable,
    prepKitchen,
  } = req.body; // Extract key and value from request body

  if (!id || rate === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Values are required" });
  }

  try {
    // Call the model function to execute the SQL query
    const result = await ItemModel.updateItem(
      id,
      name,
      catId,
      rate,
      packingRate,
      desc1,
      desc2,
      dailyRefresh,
      itemAvailable,
      prepKitchen
    );

    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Item updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.insertItem = async (req, res, next) => {
  const { kitchenid, name, catId,counterId, rate, packingRate, desc1, desc2 } = req.body;

  try {
    const result = await ItemModel.insertItem(
      kitchenid,
      name,
      catId,
      counterId,
      rate,
      packingRate,
      desc1,
      desc2
    );
    id = result.insertId;
    if (result.affectedRows > 0) {
      const strName = name.replace(/ /g, "-");
      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadService.uploadToS3(
          req.file,
          kitchenid,
          strName,
          id
        );
      } else {
        imageUrl = process.env.DEFAULT_FOOD_IMG;
      }

      const response = await ItemModel.updateItemImg(imageUrl, id);

      if (response.affectedRows > 0) {
        return res.status(201).json({
          success: true,
          message: "Item Inserted successfully",
        });
      } else {
        return res
          .status(500)
          .json({ success: false, message: "Failed to add Item" });
      }
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to add Item" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const id = req.params.id;

    //fetch img url and delete from s3

    const itemData = await ItemModel.getItemById(id);
    const imgUrl = itemData[0].itemImg;

    const imgRes = await uploadService.deleteFromS3(imgUrl);

    if (imgRes == true) {
      const data = await ItemModel.deleteItem(id);
      if (data.affectedRows > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    next(err);
  }
};
