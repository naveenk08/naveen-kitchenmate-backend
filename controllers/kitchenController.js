const multer = require("multer");
const kitechnModel = require("../models/kitchenModel.js");
const UserModel = require("../models/userModel");

const uploadService = require("../services/s3Service.js");

exports.insertItem = async (req, res, next) => {
  const {
    userid,
    kitchenName,
    address1,
    address2,
    contact,
    email,
    secret,
    tables,
  } = req.body;

  const result = await kitechnModel.getKitchen(kitchenName, contact);
  if (result.length > 0) {
    return res.json({ success: false, message: "Kitchen Already Exist!" });
  }

  try {
    const result = await kitechnModel.insertKitchen(
      kitchenName,
      address1,
      address2,
      contact,
      email,
      secret,
      tables
    );

    const id = result.insertId;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadService.uploadToS3(
        req.file,
        id,
        kitchenName,
        "logo"
      );
    } else {
      imageUrl = process.env.DEFAULT_FOOD_IMG;
    }

    const updateLogo = await kitechnModel.updateLogo(id, imageUrl);

    const updateUser = await UserModel.updateAdminUserKitchen(userid, id);

    if (updateUser.affectedRows > 0 && updateLogo.affectedRows > 0) {
      return res.status(201).json({
        success: true,
        message: "Kitchen Inserted successfully",
      });
    } else {
      return res.json({ success: false, message: "Failed to add Item" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getKitchenBySecret = async (req, res, next) => {
  const value = req.params.value;

  try {
    const data = await kitechnModel.getKitchenBySecret(value);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getKitchenById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const data = await kitechnModel.getKitchenById(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.updateKitchen = async (req, res) => {
  const { id, name, addr1, addr2, contact, email, table, custOrder,defaultCat,defaultPrinting,kot } = req.body;

  try {
    const result = await kitechnModel.updateKitchenDetails(
      id,
      name,
      addr1,
      addr2,
      contact,
      email,
      table,
      custOrder,defaultCat,defaultPrinting,kot
    );
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Kitchen not found" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getPendingUserApproval = async (req, res, next) => {
  const id = req.params.id;

  try {
    const data = await kitechnModel.getPendingUserApproval(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getKitchenCounters = async (req, res, next) => {
  const id = req.params.id;

  try {
    const data = await kitechnModel.getKitchenCounters(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getPaymentOptions = async (req, res, next) => {
  const id = req.params.id;  

  try {
    const data = await kitechnModel.getPaymentOptions(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.deletePaymentOption = async (req, res, next) => {
  const id = req.params.id;  
  

  try {
    const data = await kitechnModel.deletePaymentOption(id);
    if(data.affectedRows>0)
    res.json({success:true});
  else res.json({success:false});
  } catch (err) {
    next(err);
  }
};
exports.addPaymentOption = async (req, res, next) => {

  
  const {kitchenId, optionName} = req.body;  

  try {
    const data = await kitechnModel.addPaymentOption(kitchenId, optionName);
    if(data.affectedRows>0)
    res.json({success:true});
  else res.json({success:false});
  } catch (err) {
    next(err);
  }
};
exports.getHomeScreenData = async (req, res, next) => {

  
  const {id} = req.params;  
  try {
    const rev = await kitechnModel.getRevenue(id);
    const exp = await kitechnModel.getExpense(id);
    const last3 = await kitechnModel.getLatestOrders(id);

    if(rev && last3)
    res.json({success:true, revenue:rev, expense:exp,recent:last3});
  else res.json({success:false});
  } catch (err) {
    next(err);
  }
};

exports.getTableStatus = async (req, res, next) => {
  
  const {kitchenId, table} = req.query;  
  try {
    const status = await kitechnModel.getTableStatus(kitchenId,table);
    

    if(status.length==0)
    res.json({allowed:true});
  else res.json({allowed:false});
  } catch (err) {
    next(err);
  }
};
exports.getTableDetails = async (req, res, next) => {
  
  const {kitchenId} = req.query;  
  try {
    const status = await kitechnModel.getTableDetails(kitchenId);
    if(status)
    res.json({success:true,status});
  else res.json({success:false});
  } catch (err) {
    next(err);
  }
};
