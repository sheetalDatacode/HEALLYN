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
} = require('../../controllers/pharmacy-controllers/pharmacyNotificationController');

router.get('/', protect(ROLES.PHARMACY), getNotifications);
router.get('/unread-count', protect(ROLES.PHARMACY), getUnreadCount);
router.patch('/:notificationId/read', protect(ROLES.PHARMACY), markAsRead);
router.patch('/read-all', protect(ROLES.PHARMACY), markAllAsRead);
router.delete('/:notificationId', protect(ROLES.PHARMACY), deleteNotification);

module.exports = router;

