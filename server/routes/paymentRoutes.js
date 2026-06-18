const express = require('express');
const { initializeOrder, verifyPayment, paystackWebhook } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/initialize', protect, initializeOrder);
router.get('/verify/:reference', protect, verifyPayment);
router.post('/webhook', paystackWebhook); // Webhook does not use JWT protect, we check HMAC signature inside the controller

module.exports = router;
