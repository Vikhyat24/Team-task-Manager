import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';
import dashboardRouter from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/dashboard', dashboardRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
