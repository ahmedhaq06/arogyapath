import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export const referralRouter = Router();

// Create Referral
referralRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      patientId,
      referringFacilityId,
      receivingFacilityId,
      receivingProviderId,
      urgency,
      reason,
      clinicalSummary,
      symptoms,
      relevantHistory,
      vitals,
      diagnostics,
      notes,
    } = req.body;

    const count = await prisma.referral.count();
    const referralId = `REF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Get referring provider ID from user if available
    const provider = await prisma.provider.findFirst({ where: { userId: req.user!.id } });
    const referringProviderId = provider?.id || (await prisma.provider.findFirst())?.id;

    if (!referringProviderId) {
      throw new AppError(400, 'NO_PROVIDER', 'A valid provider record is required to create a referral.');
    }

    const referral = await prisma.referral.create({
      data: {
        referralId,
        patientId,
        referringFacilityId,
        receivingFacilityId,
        referringProviderId,
        receivingProviderId: receivingProviderId || null,
        urgency: urgency || 'routine',
        reason,
        clinicalSummary,
        symptoms: symptoms ? JSON.stringify(symptoms) : null,
        relevantHistory,
        vitals: vitals ? JSON.stringify(vitals) : null,
        diagnostics: diagnostics ? JSON.stringify(diagnostics) : null,
        notes,
        status: 'SUBMITTED',
        statusHistory: {
          create: {
            status: 'SUBMITTED',
            changedBy: req.user!.id,
            notes: 'Referral created and submitted.',
          },
        },
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        referringFacility: { select: { name: true, phone: true, village: true, district: true } },
        receivingFacility: { select: { name: true, phone: true, village: true, district: true } },
      },
    });

    res.status(201).json({ success: true, data: referral });
  } catch (err) {
    next(err);
  }
});

// List Referrals
referralRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, urgency, patientId, facilityId, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    if (patientId) where.patientId = patientId;

    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({ where: { userId: req.user!.id } });
      if (patient) where.patientId = patient.id;
    } else if (facilityId) {
      where.OR = [
        { referringFacilityId: facilityId },
        { receivingFacilityId: facilityId },
      ];
    }

    if (search) {
      where.OR = [
        { referralId: { contains: search } },
        { reason: { contains: search } },
        { patient: { user: { firstName: { contains: search } } } },
        { patient: { user: { lastName: { contains: search } } } },
      ];
    }

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          referringFacility: { select: { name: true } },
          receivingFacility: { select: { name: true } },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.count({ where }),
    ]);

    res.json({ success: true, data: { referrals, total, page: parseInt(page), limit: take } });
  } catch (err) {
    next(err);
  }
});

// Get Referral Detail
referralRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
            vitals: { orderBy: { recordedAt: 'desc' }, take: 5 },
            allergies: true,
            conditions: true,
          },
        },
        referringFacility: true,
        receivingFacility: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!referral) throw new AppError(404, 'NOT_FOUND', 'Referral not found.');

    res.json({ success: true, data: referral });
  } catch (err) {
    next(err);
  }
});

// Update Referral Status (lifecycle transition)
referralRouter.patch('/:id/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes, receivingProviderId } = req.body;

    const existing = await prisma.referral.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Referral not found.');

    const updated = await prisma.$transaction(async (tx: any) => {
      const ref = await tx.referral.update({
        where: { id },
        data: {
          status,
          ...(receivingProviderId && { receivingProviderId }),
        },
      });

      await tx.referralStatusHistory.create({
        data: {
          referralId: id,
          status,
          changedBy: req.user!.id,
          notes: notes || `Status updated to ${status}`,
        },
      });

      return ref;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
