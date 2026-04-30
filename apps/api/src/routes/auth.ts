import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/requireAuth';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth routes
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError(409, 'CONFLICT', 'User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(400, 'VALIDATION_ERROR', 'Invalid input data', error.issues));
    } else {
      next(error);
    }
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw createError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw createError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(400, 'VALIDATION_ERROR', 'Invalid input data', error.issues));
    } else {
      next(error);
    }
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
