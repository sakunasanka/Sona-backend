// import express from 'express';
// import {
//   getAllClients,
//   getClientById,
//   searchClients,
//   updateStudentPackageStatus,
//   getClientStats
// } from '../controllers/AdminClientController';
// import { authenticateToken } from '../middlewares/auth';

// const router = express.Router();

// // Get all clients
// router.get('/', authenticateToken, getAllClients);

// // Get client by ID
// router.get('/:id', authenticateToken, getClientById);

// // Search clients with filters
// router.get('/search', authenticateToken, searchClients);

// // Update student package status (approve/reject)
// router.patch('/:id/student-package', authenticateToken, updateStudentPackageStatus);

// // Get client statistics
// router.get('/stats', authenticateToken, getClientStats);

// export default router;