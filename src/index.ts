import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedDatabase } from './config/seed';

// Import Routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import tutorRoutes from './routes/tutor';
import studentRoutes from './routes/student';
import parentRoutes from './routes/parent';
import messagesRoutes from './routes/messages';
import aiRoutes from './routes/ai';
import paymentRoutes from './routes/payment';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database & run Seeder
const initApp = async () => {
  await connectDB();
  await seedDatabase();
};

initApp();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', paymentRoutes);

// Base route status check
app.get('/status', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Tutor CRM Backend Running'
  });
});

// Start Server listener
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
