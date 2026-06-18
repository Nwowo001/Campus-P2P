const express = require('express');
const { getOrders, getOrderById, deliverOrder, completeOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/deliver', protect, deliverOrder);
router.put('/:id/complete', protect, completeOrder);

module.exports = router;
