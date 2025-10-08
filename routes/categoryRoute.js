const express = require('express');
const CategoryController = require('../controllers/categoryController');
const router = express.Router();

router.get('/:id', CategoryController.getAllCategory);
router.get('/getActiveCat/:id', CategoryController.getAllActiveCategory);
router.get('/getCatforKitchen/:id', CategoryController.getCategoryForKitchen);
router.post('/addCategory', CategoryController.addCategory);
router.get('/deleteCategory/:id', CategoryController.deleteCategory);

module.exports = router;
