import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { syncDatabase } from './config/sync';

// Import routes
import userRoutes from './routes/UserRoutes';
import postRoutes from './routes/PostRoutes';
import sessionRoutes from './routes/SessionRoutes';
import authRoutes from './routes/AuthRoutes';
import { auth } from 'firebase-admin';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sona PostgreSQL Backend is running!',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      posts: '/api/posts',
      sessions: '/api/sessions',
      auth: '/api/auth'
    },
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Database Connection and Sync
const initializeApp = async () => {
  try {
    await connectDB();
    // Sync Database
    // await syncDatabase();
    
    // Start Server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
};

initializeApp();