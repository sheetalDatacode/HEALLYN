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
} = require('../../controllers/nurse-controllers/nurseNotificationController');

router.get('/', protect(ROLES.NURSE), getNotifications);
router.get('/unread-count', protect(ROLES.NURSE), getUnreadCount);
router.patch('/:notificationId/read', protect(ROLES.NURSE), markAsRead);
router.patch('/read-all', protect(ROLES.NURSE), markAllAsRead);
router.delete('/:notificationId', protect(ROLES.NURSE), deleteNotification);

module.exports = router;
