import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, getDbStatus } from './config/db.js';
import { dbStore } from './services/dbStore.js';
import issueRoutes from './routes/issues.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import gisRoutes from './routes/gis.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Connect to Database (with automatic in-memory fallback)
connectDB().then(() => {
  dbStore.seedIfEmpty();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CivixAI Smart Civic Resolver',
    version: '1.0.0',
    db: getDbStatus(),
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gis', gisRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CivixAI Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Civic Service Exception',
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏛️  CivixAI Municipal Platform Server running on port ${PORT}`);
  console.log(`📡  REST API: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
