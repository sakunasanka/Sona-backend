import { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { StudentService } from "../services/StudentService";
import { ValidationError } from "../utils/errors";

/**
 * @desc    Apply for student plan
 * @route   POST /api/students/apply
 * @access  Private (client only)
 */
export const applyForStudentPlan = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.dbUser.id;

  if (!clientId) {
    throw new ValidationError('Client ID is required');
  }

  const { fullName, university, studentIDCopy, uniEmail } = req.body;

  // Validate required fields
  if (!fullName || !university || !studentIDCopy || !uniEmail) {
    throw new ValidationError('All fields are required: fullName, university, studentIDCopy, uniEmail');
  }

  const studentApplication = await StudentService.applyForStudentPlan({
    clientId,
    fullName,
    university,
    studentIDCopy,
    uniEmail,
  });

  ApiResponseUtil.success(res, {
    studentApplication: {
      id: studentApplication.id,
      clientId: studentApplication.clientId,
      fullName: studentApplication.fullName,
      university: studentApplication.university,
      uniEmail: studentApplication.uniEmail,
      applicationStatus: studentApplication.applicationStatus,
      createdAt: studentApplication.createdAt,
    }
  }, "Student plan application submitted successfully");
});

/**
 * @desc    Get client's student application status
 * @route   GET /api/students/application
 * @access  Private (client only)
 */
export const getStudentApplication = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.dbUser.id;

  if (!clientId) {
    throw new ValidationError('Client ID is required');
  }

  const studentApplication = await StudentService.getStudentApplication(clientId);

  if (!studentApplication) {
    return ApiResponseUtil.notFound(res, "No student application found");
  }

  ApiResponseUtil.success(res, { studentApplication }, "Student application retrieved successfully");
});

/**
 * @desc    Get all student applications (admin only)
 * @route   GET /api/admin/students/applications
 * @access  Private (admin only)
 */
export const getAllStudentApplications = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const validStatuses = ['pending', 'approved', 'rejected'];
  if (status && !validStatuses.includes(status as string)) {
    throw new ValidationError('Invalid status. Must be one of: pending, approved, rejected');
  }

  const applications = await StudentService.getAllStudentApplications(status as 'pending' | 'approved' | 'rejected' | undefined);

  ApiResponseUtil.success(res, {
    applications,
    count: applications.length
  }, "Student applications retrieved successfully");
});

/**
 * @desc    Update student application status (admin only)
 * @route   PUT /api/admin/students/applications/:id
 * @access  Private (admin only)
 */
export const updateStudentApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!id || isNaN(Number(id))) {
    throw new ValidationError('Valid application ID is required');
  }

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    throw new ValidationError('Valid status is required (pending, approved, or rejected)');
  }

  if (status === 'rejected' && !rejectionReason) {
    throw new ValidationError('Rejection reason is required when rejecting an application');
  }

  const updatedApplication = await StudentService.updateApplicationStatus(
    Number(id),
    status,
    rejectionReason
  );

  ApiResponseUtil.success(res, { application: updatedApplication }, "Student application status updated successfully");
});

/**
 * @desc    Check if client is approved student
 * @route   GET /api/students/status
 * @access  Private (client only)
 */
export const checkStudentStatus = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.dbUser.id;

  if (!clientId) {
    throw new ValidationError('Client ID is required');
  }

  const isApprovedStudent = await StudentService.isApprovedStudent(clientId);

  ApiResponseUtil.success(res, { isApprovedStudent }, "Student status checked successfully");
});