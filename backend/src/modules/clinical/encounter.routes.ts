import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export const encounterRouter = Router();

// Create Encounter (Clinical Consultation)
encounterRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      patientId,
      facilityId,
      chiefComplaint,
      presentIllness,
      assessment,
      diagnosis,
      diagnosisCode,
      treatmentPlan,
      clinicalNotes,
      vitals,
      diagnoses,
    } = req.body;

    // Get provider ID
    const provider = await prisma.provider.findFirst({ where: { userId: req.user!.id } });
    const providerId = provider?.id || (await prisma.provider.findFirst())?.id;

    if (!providerId) {
      throw new AppError(400, 'NO_PROVIDER', 'A valid provider record is required to create encounters.');
    }

    // Resolve valid patient ID
    let validPatientId = patientId;
    if (patientId) {
      const p = await prisma.patient.findUnique({ where: { id: patientId } });
      if (p) validPatientId = p.id;
    }
    if (!validPatientId) {
      const p = await prisma.patient.findFirst();
      if (p) validPatientId = p.id;
    }

    // Resolve valid facility ID
    let validFacilityId = facilityId;
    if (facilityId) {
      const f = await prisma.facility.findUnique({ where: { id: facilityId } });
      if (f) validFacilityId = f.id;
    }
    if (!validFacilityId) {
      const f = await prisma.facility.findFirst();
      if (f) validFacilityId = f.id;
    }

    const encounter = await prisma.$transaction(async (tx: any) => {
      const enc = await tx.encounter.create({
        data: {
          patientId: validPatientId,
          providerId,
          facilityId: validFacilityId,
          chiefComplaint,
          presentIllness,
          assessment,
          diagnosis,
          diagnosisCode,
          treatmentPlan,
          clinicalNotes,
          status: 'completed',
        },
      });

      // Record vitals if provided
      if (vitals) {
        await tx.vital.create({
          data: {
            patientId: validPatientId,
            encounterId: enc.id,
            recordedBy: req.user!.id,
            temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
            systolicBP: vitals.systolicBP || vitals.systolic ? parseInt(vitals.systolicBP || vitals.systolic) : null,
            diastolicBP: vitals.diastolicBP || vitals.diastolic ? parseInt(vitals.diastolicBP || vitals.diastolic) : null,
            heartRate: vitals.heartRate || vitals.pulse ? parseInt(vitals.heartRate || vitals.pulse) : null,
            respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
            oxygenSaturation: vitals.oxygenSaturation || vitals.spo2 ? parseFloat(vitals.oxygenSaturation || vitals.spo2) : null,
            weight: vitals.weight ? parseFloat(vitals.weight) : null,
            height: vitals.height ? parseFloat(vitals.height) : null,
          },
        });
      }

      // Record conditions if provided
      if (diagnoses && Array.isArray(diagnoses)) {
        for (const diag of diagnoses) {
          await tx.condition.create({
            data: {
              patientId: validPatientId,
              name: typeof diag === 'string' ? diag : diag.name,
              code: diag.code || diag.icd10Code || null,
              status: 'active',
              onsetDate: new Date(),
            },
          });
        }
      }

      return enc;
    });

    res.status(201).json({ success: true, data: encounter });
  } catch (err) {
    next(err);
  }
});

// List Encounters
encounterRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { patientId, facilityId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (facilityId) where.facilityId = facilityId;

    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({ where: { userId: req.user!.id } });
      if (patient) where.patientId = patient.id;
    }

    const [encounters, total] = await Promise.all([
      prisma.encounter.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          provider: { include: { user: { select: { firstName: true, lastName: true } } } },
          facility: { select: { name: true } },
          vitals: true,
          diagnosticOrders: true,
          prescriptions: true,
        },
        skip,
        take,
        orderBy: { encounterDate: 'desc' },
      }),
      prisma.encounter.count({ where }),
    ]);

    res.json({ success: true, data: { encounters, total, page: parseInt(page), limit: take } });
  } catch (err) {
    next(err);
  }
});

// Get Encounter Detail
encounterRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const encounter = await prisma.encounter.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
        facility: true,
        vitals: true,
        diagnosticOrders: { include: { results: true, test: true } },
        prescriptions: { include: { items: true } },
      },
    });

    if (!encounter) throw new AppError(404, 'NOT_FOUND', 'Encounter not found.');

    res.json({ success: true, data: encounter });
  } catch (err) {
    next(err);
  }
});
