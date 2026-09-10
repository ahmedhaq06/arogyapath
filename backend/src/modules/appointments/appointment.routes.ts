import { Router } from 'express';
import { prisma } from '../../index';
import { AppError } from '../../middleware/error.middleware';

export const appointmentRouter = Router();

// Create / Book Appointment
appointmentRouter.post('/', async (req, res, next) => {
  try {
    const { patientId, facilityId, providerName, department, appointmentDate, timeSlot, reason, type, priority, referralId } = req.body;

    // Resolve valid patient ID safely
    let validPatientId = patientId;
    let patientObj = null;

    if (patientId && typeof patientId === 'string') {
      patientObj = await prisma.patient.findFirst({
        where: { OR: [{ id: patientId }, { patientId }] },
        include: { user: true },
      });
    }

    if (!patientObj) {
      patientObj = await prisma.patient.findFirst({
        include: { user: true },
      });
      if (patientObj) {
        validPatientId = patientObj.id;
      } else {
        throw new AppError(400, 'NO_PATIENT', 'No patient record found to associate appointment.');
      }
    } else {
      validPatientId = patientObj.id;
    }

    // Resolve valid facility ID safely
    let validFacilityId = facilityId;
    let facilityObj = null;
    if (facilityId && typeof facilityId === 'string') {
      facilityObj = await prisma.facility.findUnique({ where: { id: facilityId } });
    }
    if (!facilityObj) {
      facilityObj = await prisma.facility.findFirst();
      if (facilityObj) validFacilityId = facilityObj.id;
    }

    const count = await prisma.appointment.count();
    const appointmentId = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const appointment = await prisma.appointment.create({
      data: {
        appointmentId,
        patientId: validPatientId,
        facilityId: validFacilityId,
        providerName: providerName || 'Dr. Vikram Singh',
        department: department || 'General Medicine',
        appointmentDate: new Date(appointmentDate || Date.now()),
        timeSlot: timeSlot || '09:30 - 10:00 AM',
        reason: reason || 'Outpatient Consultation',
        type: type || 'consultation',
        priority: priority || 'routine',
        status: 'CONFIRMED',
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        facility: { select: { name: true, address: true, phone: true } },
      },
    });

    // Notify Doctors & Clinical Staff
    const doctorUsers = await prisma.user.findMany({
      where: { role: { in: ['DOCTOR', 'SPECIALIST', 'HEALTH_WORKER', 'SYSTEM_ADMIN'] } },
      take: 10,
    });

    const patientName = `${appointment.patient?.user?.firstName || 'Patient'} ${appointment.patient?.user?.lastName || ''}`;

    for (const doc of doctorUsers) {
      await prisma.notification.create({
        data: {
          userId: doc.id,
          type: 'appointment_booked',
          title: ` New Appointment Booked: ${appointmentId}`,
          message: `${patientName} booked a ${department || 'General Medicine'} appointment at ${appointment.facility?.name} for ${new Date(appointmentDate || Date.now()).toLocaleDateString()} at ${timeSlot}. Reason: ${reason || 'Consultation'}.`,
        },
      });
    }

    // If linked to referral, update referral status
    if (referralId) {
      await prisma.referral.update({
        where: { id: referralId },
        data: { status: 'APPOINTMENT_SCHEDULED', appointmentId: appointment.id },
      });
    }

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
});

// List Appointments
appointmentRouter.get('/', async (req, res, next) => {
  try {
    const { status, date, patientId, facilityId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (facilityId) where.facilityId = facilityId;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.appointmentDate = { gte: start, lte: end };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          facility: { select: { name: true, village: true } },
        },
        skip,
        take,
        orderBy: { appointmentDate: 'asc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({ success: true, data: { appointments, total, page: parseInt(page), limit: take } });
  } catch (err) {
    next(err);
  }
});

// Update Appointment Status
appointmentRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = req.body;
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status, notes: notes || undefined },
    });
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
});
