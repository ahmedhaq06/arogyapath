import { Router } from 'express';
import { prisma } from '../../index';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

export const analyticsRouter = Router();

// System Analytics & Metrics Dashboard (Admin / Doctor)
analyticsRouter.get('/dashboard', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const [
      totalPatients,
      totalFacilities,
      totalReferrals,
      totalAppointments,
      totalTriageAssessments,
      referralsByStatusRaw,
      triageByCategoryRaw,
      referralsByPriorityRaw,
      recentTriageAssessments,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.facility.count(),
      prisma.referral.count(),
      prisma.appointment.count(),
      prisma.triageAssessment.count(),
      prisma.referral.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.triageAssessment.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.referral.groupBy({ by: ['urgency'], _count: { id: true } }),
      prisma.triageAssessment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
    ]);

    const referralsByStatus = referralsByStatusRaw.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    const triageByCategory = triageByCategoryRaw.reduce((acc: any, curr: any) => {
      acc[curr.category] = curr._count.id;
      return acc;
    }, {});

    const referralsByPriority = referralsByPriorityRaw.reduce((acc: any, curr: any) => {
      acc[curr.urgency] = curr._count.id;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        metrics: {
          totalPatients,
          totalFacilities,
          totalReferrals,
          totalAppointments,
          totalTriageAssessments,
        },
        breakdowns: {
          referralsByStatus,
          triageByCategory,
          referralsByPriority,
        },
        recentTriage: recentTriageAssessments,
      },
    });
  } catch (err) {
    next(err);
  }
});
