import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createError } from './errorHandler';

declare module 'express-serve-static-core' {
  interface Request {
    membership?: {
      id: string;
      role: string;
      projectId: string;
    };
  }
}

export const loadProjectMembership = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const projectId = (req.params.projectId || req.params.id) as string;
    const userId = req.user?.id;

    if (!projectId) {
      throw createError(400, 'BAD_REQUEST', 'Project ID is required');
    }

    if (!userId) {
      throw createError(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw createError(404, 'NOT_FOUND', 'Project not found or you are not a member');
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};
