import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { patientRouter } from './modules/patients/patient.routes';
import { triageRouter } from './modules/triage/triage.routes';
import { facilityRouter } from './modules/facilities/facility.routes';
import { referralRouter } from './modules/referrals/referral.routes';
import { appointmentRouter } from './modules/appointments/appointment.routes';
import { diagnosticRouter } from './modules/diagnostics/diagnostic.routes';
import { prescriptionRouter } from './modules/prescriptions/prescription.routes';
import { encounterRouter } from './modules/clinical/encounter.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { auditRouter } from './modules/audit/audit.routes';
import { educationRouter } from './modules/education/education.routes';
import { syncRouter } from './modules/sync/sync.routes';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
});
app.use('/api/', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
});
app.use('/api/auth/login', authLimiter);

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});
app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/patients', patientRouter);
app.use('/api/triage', triageRouter);
app.use('/api/facilities', facilityRouter);
app.use('/api/referrals', referralRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/diagnostics', diagnosticRouter);
app.use('/api/prescriptions', prescriptionRouter);
app.use('/api/encounters', encounterRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/education', educationRouter);
app.use('/api/sync', syncRouter);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🏥 ArogyaPath API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;
