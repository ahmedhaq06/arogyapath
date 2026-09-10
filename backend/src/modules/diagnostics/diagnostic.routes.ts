import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export const diagnosticRouter = Router();

// Order Diagnostic Test
diagnosticRouter.post('/orders', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { patientId, facilityId, testName, category, priority, reason, encounterId } = req.body;

    const count = await prisma.diagnosticOrder.count();
    const orderId = `LAB-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Get or create test definition
    let test = await prisma.diagnosticTest.findFirst({ where: { name: testName } });
    if (!test) {
      test = await prisma.diagnosticTest.create({
        data: { name: testName, category: category || 'general' },
      });
    }

    // Get ordering provider
    const provider = await prisma.provider.findFirst({ where: { userId: req.user!.id } });
    const orderingProviderId = provider?.id || (await prisma.provider.findFirst())?.id;

    if (!orderingProviderId) {
      throw new AppError(400, 'NO_PROVIDER', 'A valid provider record is required to order tests.');
    }

    const order = await prisma.diagnosticOrder.create({
      data: {
        orderId,
        patientId,
        testId: test.id,
        orderingProviderId,
        facilityId,
        priority: priority || 'routine',
        reason,
        encounterId: encounterId || null,
        status: 'ORDERED',
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        facility: { select: { name: true } },
        test: true,
      },
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// List Diagnostic Orders
diagnosticRouter.get('/orders', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, priority, patientId, facilityId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (patientId) where.patientId = patientId;
    if (facilityId) where.facilityId = facilityId;

    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({ where: { userId: req.user!.id } });
      if (patient) where.patientId = patient.id;
    }

    const [orders, total] = await Promise.all([
      prisma.diagnosticOrder.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          facility: { select: { name: true } },
          orderingProvider: { include: { user: { select: { firstName: true, lastName: true } } } },
          test: true,
          results: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diagnosticOrder.count({ where }),
    ]);

    res.json({ success: true, data: { orders, total, page: parseInt(page), limit: take } });
  } catch (err) {
    next(err);
  }
});

// Submit Test Result (Lab Tech / Doctor)
diagnosticRouter.post('/orders/:id/results', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { parameterName, value, unit, referenceRange, isAbnormal, interpretation, notes } = req.body;

    const order = await prisma.diagnosticOrder.findUnique({ where: { id } });
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Diagnostic order not found.');

    const result = await prisma.diagnosticResult.create({
      data: {
        orderId: id,
        parameterName: parameterName || 'Result',
        value: String(value),
        unit,
        referenceRange,
        isAbnormal: isAbnormal || false,
        interpretation,
        notes,
        enteredBy: req.user!.id,
      },
    });

    // Update order status to RELEASED
    await prisma.diagnosticOrder.update({
      where: { id },
      data: { status: 'RELEASED', resultReadyAt: new Date(), releasedAt: new Date() },
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
