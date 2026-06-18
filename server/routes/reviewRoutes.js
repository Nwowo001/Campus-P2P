const express = require('express');
const { body } = require('express-validator');
const { createReview, getUserReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('orderId', 'Order ID is required').not().isEmpty(),
    body('rating', 'Rating must be an integer between 1 and 5').isInt({ min: 1, max: 5 }),
    body('comment', 'Comment is required').not().isEmpty().trim(),
  ],
  createReview
);

router.get('/user/:userId', getUserReviews);

module.exports = router;
