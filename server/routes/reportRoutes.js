const express = require('express');
const { body } = require('express-validator');
const { createReport, getReports, deleteReport, getAdminStats } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('reportedUserId', 'Reported User ID is required').not().isEmpty(),
    body('reason', 'Reason is required').not().isEmpty().trim(),
  ],
  createReport
);

// Admin-only routes
router.get('/', protect, admin, getReports);
router.get('/stats', protect, admin, getAdminStats);
router.delete('/:id', protect, admin, deleteReport);

module.exports = router;
