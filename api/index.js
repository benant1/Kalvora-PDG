import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth.js';
import blogRoutes from '../routes/blog.js';
import marketRoutes from '../routes/market.js';
import requestRoutes from '../routes/requests.js';
import socialShareRoutes from '../routes/socialShare.js';
import techRoutes from '../routes/tech.js';
import uploadRoutes from '../routes/upload.js';
import userRoutes from '../routes/userRoutes.js';
import vendorRoutes from '../routes/vendorRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';

const app = express();

// Middleware
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/social', socialShareRoutes);
app.use('/api/tech', techRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);

// Route de test
app.get('/api/hello', (req, res) => {
  const value = process.env.HELLO || process.env.GREETING || 'not set';
  res.status(200).json({ message: 'hello', env: value });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default async (req, res) => {
  return app(req, res);
};