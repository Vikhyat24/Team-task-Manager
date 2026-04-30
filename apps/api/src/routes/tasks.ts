import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { createError } from '../middleware/errorHandler';
import { canEditTask, canChangeTaskStatus } from '../utils/rbac';

const router = Router();
router.use(requireAuth);

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

// Middleware to fetch task and check project membership
const loadTaskAndMembership = async (req: any, res: any, next: any) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      throw createError(404, 'NOT_FOUND', 'Task not found');
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: task.projectId, userId: req.user.id },
      },
    });

    if (!membership) {
      throw createError(403, 'FORBIDDEN', 'You are not a member of this project');
    }

    req.task = task;
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
router.get('/:id', loadTaskAndMembership, async (req: any, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } }
    }
  });
  
  res.json({ data: task });
});

// PATCH /api/tasks/:id
router.patch('/:id', loadTaskAndMembership, async (req: any, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const { task, membership, user } = req;

    // Check if user is only updating status
    const isOnlyUpdatingStatus = Object.keys(data).length === 1 && data.status !== undefined;

    if (isOnlyUpdatingStatus) {
      if (!canChangeTaskStatus(user.id, task, membership.role)) {
        throw createError(403, 'FORBIDDEN', 'You do not have permission to change this task status');
      }
    } else {
      if (!canEditTask(user.id, task, membership.role)) {
        throw createError(403, 'FORBIDDEN', 'You do not have permission to edit this task');
      }
    }

    if (data.assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: data.assigneeId } }
      });
      if (!assigneeMember) {
        throw createError(400, 'BAD_REQUEST', 'Assignee must be a project member');
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
      }
    });

    res.json({ data: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(400, 'VALIDATION_ERROR', 'Invalid task data', error.issues));
    } else {
      next(error);
    }
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', loadTaskAndMembership, async (req: any, res, next) => {
  try {
    const { task, membership, user } = req;

    if (!canEditTask(user.id, task, membership.role)) {
      throw createError(403, 'FORBIDDEN', 'You do not have permission to delete this task');
    }

    await prisma.task.delete({
      where: { id: task.id },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

export default router;
