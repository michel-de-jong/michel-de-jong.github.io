import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from './config/database.js';
import { helmetConfig, corsOptions, apiRateLimit } from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import licenseRoutes from './routes/license.js';
import featureRoutes from './routes/features.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

await Database.connect();

app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(apiRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ROI Calculator API is running',
    timestamp: new Date().toISOString(),
    database: Database.isConnected() ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/features', featureRoutes);

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ROI Calculator API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      license: '/api/license',
      features: '/api/features'
    },
    documentation: 'https://github.com/michel-de-jong/michel-de-jong.github.io'
  });
});

app.use(notFound);

app.use(errorHandler);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await Database.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 ROI Calculator API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});
