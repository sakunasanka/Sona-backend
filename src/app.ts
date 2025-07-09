import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import http from 'http';
import path from 'path';
import { WebSocketService } from './services/WebSocketServices';
import { syncDatabase } from './config/sync';

// Import routes
import userRoutes from './routes/UserRoutes';
import postRoutes from './routes/PostRoutes';
import sessionRoutes from './routes/SessionRoutes';
import authRoutes from './routes/AuthRoutes';
import chatRoutes from './routes/ChatRoutes';
import { auth } from 'firebase-admin';

dotenv.config();

const app = express();
const server = http.createServer(app);

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
      auth: '/api/auth',
      chat: '/api/chat',
      websocket: 'ws://localhost:5001',
    },
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

//web socket 
app.use('/public', express.static('public'));
app.use('/websocket-test/', express.static('public'));

app.get('/websocket-test', (req, res) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.socket.io https://cdnjs.cloudflare.com; " +
    "script-src-elem 'self' 'unsafe-inline' https://cdn.socket.io; " + // ✅ Add 'unsafe-inline' here
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' ws://localhost:5001 http://localhost:5001; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https: data:"
  );
  res.sendFile(path.join(__dirname, '../public/websocket-test.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Check if it's our custom error class
  if (err.statusCode && err.isOperational !== undefined) {
    res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      statusCode: err.statusCode
    });
    return;
  }
  
  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
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
    //Sync Database (uncomment if needed)
    // await syncDatabase();

    WebSocketService.initialize(server);
    
    // Start Server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}`);
      console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
};

initializeApp();