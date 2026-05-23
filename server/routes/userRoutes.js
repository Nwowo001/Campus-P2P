const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { getAllUsers, toggleUserBlock, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, admin, getAllUsers);
router.put('/:id/block', protect, admin, toggleUserBlock);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
