import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // 1. Recent Projects
    const recentProjects = await prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    // 2. My Open Tasks (assigned to me, not DONE)
    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    // 3. Stats
    const allMyTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: { status: true, dueDate: true },
    });

    const now = new Date();
    const stats = {
      total: allMyTasks.length,
      todo: allMyTasks.filter((t: any) => t.status === 'TODO').length,
      inProgress: allMyTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
      done: allMyTasks.filter((t: any) => t.status === 'DONE').length,
      overdue: allMyTasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && t.dueDate < now).length,
    };

    res.json({
      data: {
        stats,
        recentProjects,
        myTasks,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
