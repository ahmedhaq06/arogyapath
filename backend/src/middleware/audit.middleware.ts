import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from './auth.middleware';

export function auditLog(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Log after the response is sent
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Only audit successful operations
      const outcome = res.statusCode < 400 ? 'success' : 'failure';
      const resourceId = req.params.id || body?.data?.id;

      prisma.auditLog.create({
        data: {
          actorId: req.user?.id,
          action,
          resource,
          resourceId,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
          }),
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']?.substring(0, 255),
          outcome,
        },
      }).catch((err: any) => console.error('[AUDIT ERROR]', err.message));

      return originalJson(body);
    };

    next();
  };
}
