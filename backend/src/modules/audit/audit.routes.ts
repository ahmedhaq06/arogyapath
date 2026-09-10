import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth.middleware';

export const auditRouter = Router();

// Get Audit Logs (Admin only)
auditRouter.get('/', authenticate, requireRole('SYSTEM_ADMIN', 'FACILITY_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { action, resource, outcome, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (outcome) where.outcome = outcome;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { firstName: true, lastName: true, role: true, email: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: { logs, total, page: parseInt(page), limit: take } });
  } catch (err) {
    next(err);
  }
});
