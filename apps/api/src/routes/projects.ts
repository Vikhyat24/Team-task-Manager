import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { loadProjectMembership } from '../middleware/loadProjectMembership';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const changeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
});

// GET /api/projects
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: projects, meta: { total: projects.length } });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const userId = req.user!.id;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
    });

    res.status(201).json({ data: project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(400, 'VALIDATION_ERROR', 'Invalid project data', error.issues));
    } else {
      next(error);
    }
  }
});

// GET /api/projects/:id
router.get('/:id', loadProjectMembership, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id as string },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!project) throw createError(404, 'NOT_FOUND', 'Project not found');

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id
router.patch('/:id', loadProjectMembership, async (req, res, next) => {
  try {
    if (req.membership?.role !== 'ADMIN') {
      throw createError(403, 'FORBIDDEN', 'Only admins can update project details');
    }

    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id as string },
      data,
    });

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', loadProjectMembership, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id as string } });
    if (project?.ownerId !== req.user?.id) {
      throw createError(403, 'FORBIDDEN', 'Only the project owner can delete the project');
    }

    await prisma.project.delete({ where: { id: req.params.id as string } });
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', loadProjectMembership, async (req, res, next) => {
  try {
    if (req.membership?.role !== 'ADMIN') {
      throw createError(403, 'FORBIDDEN', 'Only admins can invite members');
    }

    const data = inviteMemberSchema.parse(req.body);
    const userToInvite = await prisma.user.findUnique({ where: { email: data.email } });

    if (!userToInvite) {
      throw createError(404, 'NOT_FOUND', 'User with this email not found');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: req.params.id as string, userId: userToInvite.id },
      },
    });

    if (existingMember) {
      throw createError(409, 'CONFLICT', 'User is already a member');
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id as string,
        userId: userToInvite.id,
        role: 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ data: member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(400, 'VALIDATION_ERROR', 'Invalid invite data', error.issues));
    } else {
      next(error);
    }
  }
});

// PATCH /api/projects/:id/members/:userId
router.patch('/:id/members/:userId', loadProjectMembership, async (req, res, next) => {
  try {
    if (req.membership?.role !== 'ADMIN') {
      throw createError(403, 'FORBIDDEN', 'Only admins can change roles');
    }

    const targetUserId = req.params.userId as string;
    const project = await prisma.project.findUnique({ where: { id: req.params.id as string } });

    if (project?.ownerId === targetUserId) {
      throw createError(403, 'FORBIDDEN', 'Cannot change the role of the project owner');
    }

    const data = changeRoleSchema.parse(req.body);

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId: req.params.id as string, userId: targetUserId },
      },
      data: { role: data.role },
    });

    res.json({ data: member });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', loadProjectMembership, async (req, res, next) => {
  try {
    if (req.membership?.role !== 'ADMIN') {
      throw createError(403, 'FORBIDDEN', 'Only admins can remove members');
    }

    const targetUserId = req.params.userId as string;
    const project = await prisma.project.findUnique({ where: { id: req.params.id as string } });

    if (project?.ownerId === targetUserId) {
      throw createError(403, 'FORBIDDEN', 'Cannot remove the project owner');
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: req.params.id as string, userId: targetUserId },
      },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/tasks
router.get('/:id/tasks', loadProjectMembership, async (req, res, next) => {
  try {
    const { status, assigneeId, overdue } = req.query;

    const where: any = { projectId: req.params.id as string };

    if (status) where.status = status as string;
    if (assigneeId) {
      where.assigneeId = assigneeId === 'me' ? req.user!.id : (assigneeId as string);
    }
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'DONE' };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: tasks, meta: { total: tasks.length } });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/tasks
router.post('/:id/tasks', loadProjectMembership, async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    
    // Validate assignee is a member if provided
    if (data.assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.id as string, userId: data.assigneeId } }
      });
      if (!assigneeMember) {
        throw createError(400, 'BAD_REQUEST', 'Assignee must be a project member');
      }
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId: req.params.id as string,
        createdById: req.user!.id,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      }
    });

    res.status(201).json({ data: task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(400, 'VALIDATION_ERROR', 'Invalid task data', error.issues));
    } else {
      next(error);
    }
  }
});

export default router;
