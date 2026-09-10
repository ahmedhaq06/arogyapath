import { Router } from 'express';
import { prisma } from '../../index';

export const educationRouter = Router();

// Get Health Education Materials (Public / Offline cached)
educationRouter.get('/', async (req, res, next) => {
  try {
    const { category, language = 'en' } = req.query as Record<string, string>;
    const where: any = { isPublished: true, language };
    if (category) where.category = category;

    const materials = await prisma.healthEducation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: materials });
  } catch (err) {
    next(err);
  }
});
