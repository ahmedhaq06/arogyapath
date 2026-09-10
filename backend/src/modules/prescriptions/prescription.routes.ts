import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export const prescriptionRouter = Router();

// Create Prescription
prescriptionRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { patientId, encounterId, notes, items } = req.body;

    const count = await prisma.prescription.count();
    const prescriptionId = `RX-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Get provider ID
    const provider = await prisma.provider.findFirst({ where: { userId: req.user!.id } });
    const providerId = provider?.id || (await prisma.provider.findFirst())?.id;

    if (!providerId) {
      throw new AppError(400, 'NO_PROVIDER', 'A valid provider record is required to issue prescriptions.');
    }

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionId,
        patientId,
        providerId,
        encounterId: encounterId || null,
        notes,
        status: 'active',
        dispensingStatus: 'pending',
        items: {
          create: (items || []).map((item: any) => ({
            medicineName: item.medicineName || item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            route: item.route || 'oral',
            duration: item.duration,
            quantity: item.quantity ? parseInt(item.quantity) : null,
            instructions: item.instructions,
          })),
        },
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        items: true,
      },
    });

    res.status(201).json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
});

// List Prescriptions
prescriptionRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, patientId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({ where: { userId: req.user!.id } });
      if (patient) where.patientId = patient.id;
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          provider: { include: { user: { select: { firstName: true, lastName: true } } } },
          items: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    res.json({ success: true, data: { prescriptions, total, page: parseInt(page), limit: take } });
  } catch (err) {
    next(err);
  }
});

// Dispense Medication (Pharmacist)
prescriptionRouter.patch('/:id/dispense', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const prescription = await prisma.prescription.update({
      where: { id },
      data: { dispensingStatus: 'dispensed' },
      include: { items: true },
    });
    res.json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
});
