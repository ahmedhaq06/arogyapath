import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

export const notificationRouter = Router();

// Get My Notifications
notificationRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    next(err);
  }
});

// Mark as Read
notificationRouter.patch('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, data: { message: 'Notification marked as read.' } });
  } catch (err) {
    next(err);
  }
});

// Mark All as Read
notificationRouter.patch('/read-all', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, data: { message: 'All notifications marked as read.' } });
  } catch (err) {
    next(err);
  }
});
