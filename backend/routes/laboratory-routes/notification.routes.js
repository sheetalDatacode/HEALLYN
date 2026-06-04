const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../../controllers/laboratory-controllers/laboratoryNotificationController');

router.get('/', protect(ROLES.LABORATORY), getNotifications);
router.get('/unread-count', protect(ROLES.LABORATORY), getUnreadCount);
router.patch('/:notificationId/read', protect(ROLES.LABORATORY), markAsRead);
router.patch('/read-all', protect(ROLES.LABORATORY), markAllAsRead);
router.delete('/:notificationId', protect(ROLES.LABORATORY), deleteNotification);

module.exports = router;

