import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export const facilityRouter = Router();

// Public: List facilities (no auth required for discovery)
facilityRouter.get('/', async (req, res, next) => {
  try {
    const { type, district, search, hasEmergency, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (district) where.district = district;
    if (hasEmergency === 'true') where.emergencyAvailable = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { village: { contains: search } },
        { district: { contains: search } },
      ];
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          services: { where: { isAvailable: true } },
          departments: { where: { isActive: true } },
          diagnosticCapabilities: { where: { isAvailable: true } },
        },
        skip, take,
        orderBy: { level: 'asc' },
      }),
      prisma.facility.count({ where }),
    ]);

    res.json({ success: true, data: { facilities, total, page: parseInt(page), limit: take } });
  } catch (err) { next(err); }
});

// Facility recommendation engine
facilityRouter.get('/recommendations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { service, specialization, diagnosticTest, emergencyRequired, patientLat, patientLng } = req.query as Record<string, string>;

    const where: any = { isActive: true };
    if (emergencyRequired === 'true') where.emergencyAvailable = true;

    let facilities = await prisma.facility.findMany({
      where,
      include: {
        services: true,
        diagnosticCapabilities: true,
        staff: { include: { provider: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        departments: true,
      },
    });

    // Score each facility
    const scored = facilities.map((facility: any) => {
      let score = 0;
      const reasons: string[] = [];

      // Service match
      if (service) {
        const hasService = facility.services.some((s: any) => s.serviceName.toLowerCase().includes(service.toLowerCase()) && s.isAvailable);
        if (hasService) { score += 30; reasons.push(`Provides ${service}`); }
      }

      // Specialist match
      if (specialization) {
        const hasSpecialist = facility.staff.some((s: any) => s.provider.specialization?.toLowerCase().includes(specialization.toLowerCase()) && s.isActive);
        if (hasSpecialist) { score += 25; reasons.push(`${specialization} specialist available`); }
      }

      // Diagnostic match
      if (diagnosticTest) {
        const hasDiag = facility.diagnosticCapabilities.some((d: any) => d.testName.toLowerCase().includes(diagnosticTest.toLowerCase()) && d.isAvailable);
        if (hasDiag) { score += 25; reasons.push(`${diagnosticTest} testing available`); }
      }

      // Emergency capability
      if (emergencyRequired === 'true' && facility.emergencyAvailable) {
        score += 20; reasons.push('Emergency services available');
      }

      // Distance scoring (if coordinates provided)
      let distance = null;
      if (patientLat && patientLng && facility.latitude && facility.longitude) {
        distance = haversineDistance(
          parseFloat(patientLat), parseFloat(patientLng),
          facility.latitude, facility.longitude
        );
        if (distance < 5) score += 20;
        else if (distance < 15) score += 15;
        else if (distance < 30) score += 10;
        else if (distance < 50) score += 5;
        reasons.push(`${distance.toFixed(1)} km away`);
      }

      // Level bonus (prefer lower-level appropriate facilities)
      if (!emergencyRequired || emergencyRequired !== 'true') {
        score += Math.max(0, 10 - facility.level * 2);
      }

      // Bed availability
      if (facility.availableBeds > 0) {
        score += 5; reasons.push(`${facility.availableBeds} beds available`);
      }

      return { ...facility, score, reasons, distance };
    });

    // Sort by score descending
    scored.sort((a: any, b: any) => b.score - a.score);

    // Return top recommendations
    const recommendations = scored.slice(0, 5).map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      level: f.level,
      address: f.address,
      village: f.village,
      district: f.district,
      phone: f.phone,
      latitude: f.latitude,
      longitude: f.longitude,
      emergencyAvailable: f.emergencyAvailable,
      availableBeds: f.availableBeds,
      score: f.score,
      reasons: f.reasons,
      distance: f.distance,
      services: f.services.filter((s: any) => s.isAvailable).map((s: any) => s.serviceName),
      diagnostics: f.diagnosticCapabilities.filter((d: any) => d.isAvailable).map((d: any) => d.testName),
    }));

    res.json({ success: true, data: recommendations });
  } catch (err) { next(err); }
});

// Get single facility
facilityRouter.get('/:id', async (req, res, next) => {
  try {
    const facility = await prisma.facility.findUnique({
      where: { id: req.params.id },
      include: {
        services: true,
        departments: true,
        diagnosticCapabilities: true,
        equipment: true,
        staff: { include: { provider: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });
    if (!facility) throw new AppError(404, 'NOT_FOUND', 'Facility not found.');
    res.json({ success: true, data: facility });
  } catch (err) { next(err); }
});

// Create facility (admin only)
facilityRouter.post('/', authenticate, requireRole('FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const facility = await prisma.facility.create({ data: req.body });
    res.status(201).json({ success: true, data: facility });
  } catch (err) { next(err); }
});

// Update facility
facilityRouter.patch('/:id', authenticate, requireRole('FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const facility = await prisma.facility.update({ where: { id }, data: req.body });
    res.json({ success: true, data: facility });
  } catch (err) { next(err); }
});

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
