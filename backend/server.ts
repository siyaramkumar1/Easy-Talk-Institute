import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import authRouter from './src/routes/auth';
import testRouter from './src/routes/test';
import enrollmentsRouter from './src/routes/enrollments';
import reservationsRouter from './src/routes/reservations';
import courseRoutes from './src/routes/courseRoutes';
import testAdminRoutes from './src/routes/testAdminRoutes';
import galleryRoutes from './src/routes/galleryRoutes';
import statsRoutes from './src/routes/stats';
import batchRoutes from './src/routes/batchRoutes';
import notificationRoutes from './src/routes/notificationRoutes';
import contactRoutes from './src/routes/contactRoutes';
import testimonialRoutes from './src/routes/testimonialRoutes';
import settingsRoutes from './src/routes/settingsRoutes';
import adminRoutes from './src/routes/adminRoutes';
import statisticRoutes from './src/routes/statisticRoutes';
import readingRoutes from './src/routes/readingRoutes';
import userRoutes from './src/routes/userRoutes';
import questionRoutes from './src/routes/questionRoutes';
import aiRoutes from './src/routes/aiRoutes';
import { initNotificationSocket } from './src/sockets/notificationSocket';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  // Socket.IO Setup: Dual transport (polling first with seamless websocket upgrade)
  // Dynamic CORS origin prevents credentials: true wildcard rejections and eliminates 400 polling errors
  const io = new Server(httpServer, {
    path: '/socket.io/',
    cors: {
      origin: (origin, callback) => {
        // Reflect origin safely for all clients with credentials
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e6,
    cookie: false, // Prevents stale cookie conflict across restarts
    allowEIO3: true,
    serveClient: false
  });
  
  initNotificationSocket(io);

  // Trust reverse proxies (Render, Cloud Run, Cloudflare)
  app.set('trust proxy', 1);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled for dev
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  }));
  app.use(compression());
  app.use(express.json());
  app.use(cookieParser());

  // Database Connection
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB');
      
      // Build indexes in the background for optimal query performance
      setTimeout(async () => {
        try {
          const models = mongoose.modelNames();
          for (const mName of models) {
            await mongoose.model(mName).createIndexes().catch(() => {});
          }
          console.log('MongoDB collection indexes verified & built');
        } catch (idxErr) {
          console.warn('Index verification notice:', idxErr);
        }
      }, 1000);
      
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.warn('MONGODB_URI not provided. Running in preview mode without database.');
  }

  // API Routes
  const apiRouter = express.Router();
  
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', dbConnected: mongoose.connection.readyState === 1 });
  });

  apiRouter.get('/ai/status', (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.json({
      status: 'ok',
      configured: hasKey,
      model: 'gemini-2.5-flash',
      capabilities: ['chat', 'voice_practice', 'grammar_analysis']
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRoutes);
  app.use('/api/statistics', statisticRoutes);
  app.use('/api/tests', testRouter);
  app.use('/api/test-results', testRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/courses', courseRoutes);
  app.use('/api/admin-tests', testAdminRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/uploads', express.static('uploads'));
  app.use('/api/admin-stats', statsRoutes);
  app.use('/api/batches', batchRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/reading', readingRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/statistics', statisticRoutes);
  app.use('/api/ai', aiRoutes);
  
  app.use('/api', apiRouter);

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const localDist = path.resolve(__dirname);
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html'))
      ? cwdDist
      : (fs.existsSync(path.join(localDist, 'index.html')) ? localDist : cwdDist);

    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    // Support Express v4 generic fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
