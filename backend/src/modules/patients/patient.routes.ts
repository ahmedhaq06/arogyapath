import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export const patientRouter = Router();
patientRouter.use(authenticate);

// List patients (doctors, nurses, health workers, admins)
patientRouter.get('/', requireRole('DOCTOR', 'NURSE', 'HEALTH_WORKER', 'SPECIALIST', 'FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { search, page = '1', limit = '20', village, district } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { patientId: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { phone: { contains: search } } },
      ];
    }
    if (village) where.village = village;
    if (district) where.district = district;

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    // Audit
    await prisma.auditLog.create({
      data: { actorId: req.user!.id, action: 'PATIENTS_LISTED', resource: 'patient', outcome: 'success' },
    });

    res.json({ success: true, data: { patients, total, page: parseInt(page), limit: take } });
  } catch (err) { next(err); }
});

// Get single patient
patientRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, languagePreference: true } },
        allergies: true,
        conditions: { where: { status: 'active' } },
        medications: { where: { status: 'active' } },
        immunizations: { orderBy: { dateGiven: 'desc' } },
      },
    });

    if (!patient) throw new AppError(404, 'NOT_FOUND', 'Patient not found.');

    // Authorization: patients can only see their own profile
    if (req.user!.role === 'PATIENT') {
      if (patient.userId !== req.user!.id) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource.');
      }
    }

    await prisma.auditLog.create({
      data: { actorId: req.user!.id, action: 'PATIENT_VIEWED', resource: 'patient', resourceId: patient.id, outcome: 'success' },
    });

    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// Update patient profile
patientRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new AppError(404, 'NOT_FOUND', 'Patient not found.');
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'You cannot update another patient\'s profile.');
    }

    const { dateOfBirth, sex, bloodGroup, address, village, district, state, pincode,
            emergencyContactName, emergencyContactPhone, emergencyContactRelation, insuranceId } = req.body;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        sex, bloodGroup, address, village, district, state, pincode,
        emergencyContactName, emergencyContactPhone, emergencyContactRelation, insuranceId,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// Register new patient (by health worker)
patientRouter.post('/', requireRole('HEALTH_WORKER', 'NURSE', 'DOCTOR', 'FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, sex, village, district, state, languagePreference } = req.body;

    if (!firstName || !lastName) throw new AppError(400, 'VALIDATION_ERROR', 'First name and last name are required.');

    const bcrypt = require('bcryptjs');
    const tempPassword = await bcrypt.hash('Temp@1234', 12);
    const patientEmail = email || `patient_${Date.now()}@arogyapath.local`;

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email: patientEmail,
          phone,
          passwordHash: tempPassword,
          firstName, lastName,
          role: 'PATIENT',
          languagePreference: languagePreference || 'en',
        },
      });

      const count = await tx.patient.count();
      const patientId = `P-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      await tx.patient.create({
        data: {
          userId: newUser.id,
          patientId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          sex, village, district, state,
        },
      });

      await tx.auditLog.create({
        data: { actorId: req.user!.id, action: 'PATIENT_CREATED', resource: 'patient', resourceId: newUser.id, outcome: 'success' },
      });

      return newUser;
    });

    const patient = await prisma.patient.findFirst({
      where: { userId: user.id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
    });

    res.status(201).json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// Get patient medical records (encounters, vitals, diagnostics, etc.)
patientRouter.get('/:id/records', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new AppError(404, 'NOT_FOUND', 'Patient not found.');
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied.');
    }

    const [encounters, vitals, diagnosticOrders, prescriptions, referrals, followUps, allergies, conditions, medications] = await Promise.all([
      prisma.encounter.findMany({ where: { patientId: id }, include: { provider: { include: { user: { select: { firstName: true, lastName: true } } } }, facility: { select: { name: true, type: true } }, symptoms: true }, orderBy: { encounterDate: 'desc' }, take: 20 }),
      prisma.vital.findMany({ where: { patientId: id }, orderBy: { recordedAt: 'desc' }, take: 10 }),
      prisma.diagnosticOrder.findMany({ where: { patientId: id }, include: { test: true, results: true }, orderBy: { orderedAt: 'desc' }, take: 20 }),
      prisma.prescription.findMany({ where: { patientId: id }, include: { items: true, provider: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { prescribedAt: 'desc' }, take: 20 }),
      prisma.referral.findMany({ where: { patientId: id }, include: { referringFacility: { select: { name: true } }, receivingFacility: { select: { name: true } }, statusHistory: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.followUp.findMany({ where: { patientId: id }, orderBy: { scheduledDate: 'desc' }, take: 10 }),
      prisma.allergy.findMany({ where: { patientId: id } }),
      prisma.condition.findMany({ where: { patientId: id } }),
      prisma.patientMedication.findMany({ where: { patientId: id } }),
    ]);

    await prisma.auditLog.create({
      data: { actorId: req.user!.id, action: 'MEDICAL_RECORD_ACCESSED', resource: 'patient', resourceId: id, outcome: 'success' },
    });

    res.json({ success: true, data: { encounters, vitals, diagnosticOrders, prescriptions, referrals, followUps, allergies, conditions, medications } });
  } catch (err) { next(err); }
});

// Manage allergies
patientRouter.post('/:id/allergies', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { allergen, reaction, severity } = req.body;
    const allergy = await prisma.allergy.create({ data: { patientId: id, allergen, reaction, severity } });
    res.status(201).json({ success: true, data: allergy });
  } catch (err) { next(err); }
});

// Manage conditions
patientRouter.post('/:id/conditions', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, code, status, onsetDate, notes } = req.body;
    const condition = await prisma.condition.create({
      data: { patientId: id, name, code, status, onsetDate: onsetDate ? new Date(onsetDate) : undefined, notes },
    });
    res.status(201).json({ success: true, data: condition });
  } catch (err) { next(err); }
});

// Consent management
patientRouter.get('/:id/consents', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const consents = await prisma.consent.findMany({ where: { patientId: id }, orderBy: { grantedAt: 'desc' } });
    res.json({ success: true, data: consents });
  } catch (err) { next(err); }
});

patientRouter.post('/:id/consents', async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { type, description } = req.body;
    const consent = await prisma.consent.create({ data: { patientId: id, type, description } });
    res.status(201).json({ success: true, data: consent });
  } catch (err) { next(err); }
});

patientRouter.patch('/:id/consents/:consentId/revoke', async (req: AuthRequest, res, next) => {
  try {
    const consentId = Array.isArray(req.params.consentId) ? req.params.consentId[0] : req.params.consentId;
    const consent = await prisma.consent.update({
      where: { id: consentId },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    res.json({ success: true, data: consent });
  } catch (err) { next(err); }
});
