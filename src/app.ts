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
import { initializeAssociations } from './models';

// Import routes
import userRoutes from './routes/UserRoutes';
import postRoutes from './routes/PostRoutes';
import sessionRoutes from './routes/SessionRoutes';
import authRoutes from './routes/AuthRoutes';
import chatRoutes from './routes/ChatRoutes';
import paymentRoutes from './routes/PaymentRoutes';
import admincounsellorRoutes from './routes/AdminCounselorRoutes';
import adminblogsRoutes from './routes/AdminBlogsRoutes';
import adminpsychiatristRoutes from './routes/AdminPsychiatristRoutes';
import adminclientRoutes from './routes/AdminClientRoutes';
import adminmtmemberRoutes from './routes/AdminMTMemberRoutes';
import counselorRoutes from './routes/CounselorRoutes';
import psychiatristRoutes from './routes/PsychiatristRoutes';
import phq9Routes from './routes/PHQ9Routes';
import complaintRoutes from './routes/ComplaintRoutes';
import studentRoutes from './routes/StudentRoutes';
import adminDashboardRoutes from './routes/AdminDashboardRoutes';
import adminManagementRoutes from './routes/AdminManagementRoutes';
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
      payments: '/api/payments',
      counselors: '/api/counselors',
      psychiatrists: '/api/psychiatrists',
      questionnaire: '/api/questionnaire',
      complaints: '/api/complaints',
      admin: {
        dashboard: '/api/admin/dashboard',
        feedbacks: '/api/admin/feedbacks',
        complaints: '/api/admin/complaints'
      },
      websocket: 'ws://localhost:5001',
      paymentPage: '/payment-loader',
    },
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admincounsellors', admincounsellorRoutes);
app.use('/api/adminblogs', adminblogsRoutes);
app.use('/api/adminpsychiatrists', adminpsychiatristRoutes);
app.use('/api/adminclients', adminclientRoutes);
app.use('/api/adminmtmembers', adminmtmemberRoutes);

app.use('/api/counselors', counselorRoutes);
// Alias for British spelling
app.use('/api/counsellor', counselorRoutes);
app.use('/api/psychiatrists', psychiatristRoutes);
app.use('/api/questionnaire/phq9', phq9Routes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin', adminManagementRoutes);

app.use(express.static(path.join(__dirname, '../public')));


//web socket 
//app.use('/websocket-test/', express.static('public'));

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

app.get('/payment-loader', (req, res) => {
    // It's good practice to set CSP for any page served, especially for payment flows.
    // Adjust as needed, 'unsafe-inline' should be avoided if possible, but often
    // needed for inline scripts used for auto-submission.
    res.setHeader('Content-Security-Policy',
        "default-src 'self' https://sandbox.payhere.lk; " + // Allow PayHere domain
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://sandbox.payhere.lk; " + // For CryptoJS and any PayHere scripts
        "style-src 'self' 'unsafe-inline'; " +
        "connect-src 'self' http://localhost:5001 https://sandbox.payhere.lk; " + // Allow connections to your backend and PayHere
        "img-src 'self' data: https:; " +
        "font-src 'self' https: data:"
    );
    res.sendFile(path.join(__dirname, '../public/paymentgateway.html'));
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

// Initialize associations
initializeAssociations();

initializeApp();