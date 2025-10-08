const CategoryModel = require("../models/categoryModel");

exports.getAllCategory = async (req, res, next) => {
  const id = req.params.id;
  
  try {
    const data = await CategoryModel.getAllCategory(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getAllActiveCategory = async (req, res, next) => {
  const id = req.params.id;
  
  try {
    const data = await CategoryModel.getAllActiveCategory(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getCategoryForKitchen = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await CategoryModel.getCategoryForKitchen(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.addCategory = async (req, res, next) => {
  const {kitchenId,name,description} = req.body;
  try {
    const data = await CategoryModel.addCategory(kitchenId,name,description);
    if(data.affectedRows>0)
    res.json({success:true});
  else res.json({success:false});
  } catch (err) {
    next(err);
  }
};
exports.deleteCategory = async (req, res, next) => {
  const {id} = req.params;
  
  try {
    const data = await CategoryModel.deleteCategory(id);
    if(data.affectedRows>0)
    res.json({success:true});
  else res.json({success:false});
  } catch (err) {
    next(err);
  }
};
