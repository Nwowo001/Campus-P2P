const express = require('express');
const { body } = require('express-validator');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(
    protect,
    [
      body('title', 'Title is required').not().isEmpty().trim(),
      body('price', 'Price must be a positive number').isFloat({ min: 0 }),
      body('description', 'Description is required').not().isEmpty().trim(),
      body('image', 'Product image is required').not().isEmpty(),
      body('category', 'Category is required').not().isEmpty().trim(),
    ],
    createProduct
  );

router
  .route('/:id')
  .get(getProductById)
  .put(
    protect,
    [
      body('title', 'Title is required').not().isEmpty().trim(),
      body('price', 'Price must be a positive number').isFloat({ min: 0 }),
      body('description', 'Description is required').not().isEmpty().trim(),
      body('image', 'Product image is required').not().isEmpty(),
      body('category', 'Category is required').not().isEmpty().trim(),
    ],
    updateProduct
  )
  .delete(protect, deleteProduct);

module.exports = router;
