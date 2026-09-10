import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

export const syncRouter = Router();

// Offline Sync Push Endpoint — process queued actions performed offline by health workers
syncRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { items } = req.body; // Array of offline sync payloads

    const results = [];

    for (const item of (items || [])) {
      try {
        const { clientTxId, entity, action, payload } = item;

        let serverId = null;

        if (entity === 'triage' && action === 'CREATE') {
          const triage = await prisma.triageAssessment.create({
            data: {
              patientId: payload.patientId,
              conductedBy: req.user!.id,
              category: payload.category || 'ROUTINE',
              riskScore: payload.riskScore || 0,
              redFlagsDetected: payload.redFlags ? JSON.stringify(payload.redFlags) : null,
              aiSummary: payload.aiSummary || null,
            },
          });
          serverId = triage.id;
        } else if (entity === 'vitals' && action === 'CREATE') {
          const vital = await prisma.vital.create({
            data: {
              patientId: payload.patientId,
              recordedBy: req.user!.id,
              temperature: payload.temperature ? parseFloat(payload.temperature) : null,
              systolicBP: payload.systolicBP ? parseInt(payload.systolicBP) : null,
              diastolicBP: payload.diastolicBP ? parseInt(payload.diastolicBP) : null,
              heartRate: payload.heartRate ? parseInt(payload.heartRate) : null,
              respiratoryRate: payload.respiratoryRate ? parseInt(payload.respiratoryRate) : null,
              oxygenSaturation: payload.oxygenSaturation ? parseFloat(payload.oxygenSaturation) : null,
            },
          });
          serverId = vital.id;
        }

        await prisma.offlineSyncRecord.create({
          data: {
            userId: req.user!.id,
            operation: action || 'create',
            resource: entity || 'unknown',
            resourceId: serverId,
            data: JSON.stringify(payload || {}),
            status: 'synced',
            syncedAt: new Date(),
          },
        });

        results.push({ clientTxId, status: 'SUCCESS', serverId });
      } catch (itemErr: any) {
        results.push({ clientTxId: item.clientTxId, status: 'FAILED', error: itemErr.message });
      }
    }

    res.json({ success: true, data: { processed: results.length, results } });
  } catch (err) {
    next(err);
  }
});
