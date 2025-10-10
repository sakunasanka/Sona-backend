import { Router } from "express";
import {
  applyForStudentPlan,
  getStudentApplication,
  getAllStudentApplications,
  updateStudentApplicationStatus,
  checkStudentStatus
} from "../controllers/StudentController";
import { authenticateToken } from "../middlewares/auth";
import { isClient } from "../middlewares/auth";
import { isAdmin } from "../middlewares/auth";

const router = Router();

// Client routes
router.post('/apply', authenticateToken, isClient, applyForStudentPlan);
router.get('/application', authenticateToken, isClient, getStudentApplication);
router.get('/status', authenticateToken, isClient, checkStudentStatus);

// Admin routes
router.get('/admin/applications', authenticateToken, isAdmin, getAllStudentApplications);
router.put('/admin/applications/:id', authenticateToken, isAdmin, updateStudentApplicationStatus);

export default router;