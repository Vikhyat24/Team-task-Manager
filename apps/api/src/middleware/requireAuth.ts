import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createError } from './errorHandler';

// Extend Express Request interface to include the user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw createError(401, 'UNAUTHORIZED', 'Missing token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw createError(401, 'UNAUTHORIZED', 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError(401, 'UNAUTHORIZED', 'Invalid token'));
    } else {
      next(error);
    }
  }
};
