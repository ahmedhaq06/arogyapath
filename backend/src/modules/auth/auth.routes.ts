import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../index';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';
import { Role } from '@prisma/client';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

// ---- Schemas ----
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  languagePreference: z.string().optional(),
  // Patient / Resident-specific fields
  dateOfBirth: z.string().optional(),
  sex: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  insuranceId: z.string().optional(), // Used as Aadhaar Number / Health ID
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Helpers ----
function generateTokens(user: { id: string; email: string; role: Role; firstName: string; lastName: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: uuidv4() },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

async function generatePatientId(): Promise<string> {
  const count = await prisma.patient.count();
  return `P-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
}

// ---- Routes ----

// Register
authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const {
      email, password, firstName, lastName, phone, role, languagePreference,
      dateOfBirth, sex, village, district, state, bloodGroup, address, insuranceId,
      emergencyContactName, emergencyContactPhone
    } = req.body;

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    });
    if (existingUser) {
      throw new AppError(409, 'USER_EXISTS', 'An account with this email or phone already exists.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Default role is PATIENT for self-registration
    const userRole = role || Role.PATIENT;

    // Create user + patient profile in transaction
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          firstName,
          lastName,
          role: userRole,
          languagePreference: languagePreference || 'en',
        },
      });

      // Create patient profile for patients
      if (userRole === Role.PATIENT) {
        const patientId = await generatePatientId();
        await tx.patient.create({
          data: {
            userId: newUser.id,
            patientId,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            sex,
            village,
            district,
            state,
            bloodGroup,
            address,
            insuranceId, // Stores Aadhaar or Health ID
            emergencyContactName,
            emergencyContactPhone,
          },
        });
      }

      // Create provider profile for clinical roles
      if ([Role.DOCTOR, Role.SPECIALIST, Role.NURSE, Role.HEALTH_WORKER, Role.LAB_TECHNICIAN, Role.PHARMACIST].includes(userRole)) {
        await tx.provider.create({
          data: { userId: newUser.id },
        });
      }

      // Create default notification preferences
      const notifTypes = ['appointment', 'referral', 'lab', 'followup', 'prescription'];
      await tx.notificationPreference.createMany({
        data: notifTypes.map(type => ({
          userId: newUser.id,
          type,
          inApp: true,
        })),
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          action: 'USER_REGISTERED',
          resource: 'user',
          resourceId: newUser.id,
          outcome: 'success',
        },
      });

      return newUser;
    });

    const tokens = generateTokens(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          languagePreference: user.languagePreference,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Login
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt) {
      // Audit failed login
      await prisma.auditLog.create({
        data: { action: 'LOGIN_FAILURE', resource: 'auth', details: JSON.stringify({ email }), outcome: 'failure' },
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (user.isLocked) {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account is locked due to too many failed attempts. Please contact support.');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Increment failed attempts
      const attempts = user.failedAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          isLocked: attempts >= 5,
        },
      });
      await prisma.auditLog.create({
        data: { actorId: user.id, action: 'LOGIN_FAILURE', resource: 'auth', outcome: 'failure' },
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lastLoginAt: new Date() },
    });

    const tokens = generateTokens(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Audit success
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'LOGIN_SUCCESS', resource: 'auth', outcome: 'success' },
    });

    // Load patient/provider info
    let patientId = null;
    let providerId = null;
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
      patientId = patient?.id;
    } else {
      const provider = await prisma.provider.findFirst({ where: { userId: user.id } });
      providerId = provider?.id;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          languagePreference: user.languagePreference,
          patientId,
          providerId,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Refresh token
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'MISSING_TOKEN', 'Refresh token is required.');
    }

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token.');
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_TOKEN', 'User not found or inactive.');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = generateTokens(user);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } });
  } catch (err) {
    next(err);
  }
});

// Logout
authRouter.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user!.id },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ success: true, data: { message: 'Logged out successfully.' } });
  } catch (err) {
    next(err);
  }
});

// Get current user profile
authRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, languagePreference: true, createdAt: true,
        patient: {
          select: {
            id: true, patientId: true, dateOfBirth: true, sex: true, bloodGroup: true,
            address: true, village: true, district: true, state: true, pincode: true,
            insuranceId: true, emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true
          }
        },
        provider: { select: { id: true, specialization: true, qualification: true, registrationNo: true } },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// Update profile
authRouter.patch('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      firstName, lastName, phone, languagePreference,
      dateOfBirth, sex, bloodGroup, address, village, district, state, insuranceId,
      emergencyContactName, emergencyContactPhone
    } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(languagePreference && { languagePreference }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, role: true, languagePreference: true,
        patient: { select: { id: true } }
      },
    });

    if (user.role === 'PATIENT' && user.patient?.id) {
      await prisma.patient.update({
        where: { id: user.patient.id },
        data: {
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          ...(sex && { sex }),
          ...(bloodGroup && { bloodGroup }),
          ...(address && { address }),
          ...(village && { village }),
          ...(district && { district }),
          ...(state && { state }),
          ...(insuranceId && { insuranceId }),
          ...(emergencyContactName && { emergencyContactName }),
          ...(emergencyContactPhone && { emergencyContactPhone }),
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, languagePreference: true,
        patient: {
          select: {
            id: true, patientId: true, dateOfBirth: true, sex: true, bloodGroup: true,
            address: true, village: true, district: true, state: true,
            insuranceId: true, emergencyContactName: true, emergencyContactPhone: true
          }
        },
        provider: { select: { id: true, specialization: true } }
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
});

// Demo login — convenient for hackathon demos
authRouter.post('/demo-login', async (req, res, next) => {
  try {
    const { role } = req.body;
    const demoEmails: Record<string, string> = {
      PATIENT: 'patient@demo.com',
      HEALTH_WORKER: 'chw@demo.com',
      NURSE: 'nurse@demo.com',
      DOCTOR: 'doctor@demo.com',
      SPECIALIST: 'specialist@demo.com',
      LAB_TECHNICIAN: 'lab@demo.com',
      PHARMACIST: 'pharmacist@demo.com',
      FACILITY_ADMIN: 'facilityadmin@demo.com',
      SYSTEM_ADMIN: 'admin@demo.com',
    };

    const email = demoEmails[role];
    if (!email) {
      throw new AppError(400, 'INVALID_ROLE', 'Invalid demo role.');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Demo account not found. Please run the seed script.');
    }

    const tokens = generateTokens(user);
    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    let patientId = null;
    let providerId = null;
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
      patientId = patient?.id;
    } else {
      const provider = await prisma.provider.findFirst({ where: { userId: user.id } });
      providerId = provider?.id;
    }

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, languagePreference: user.languagePreference, patientId, providerId },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
});
