import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { generatePaymentLink, processPayment } from '../controllers/PaymentController';

const router = Router();

/**
 * @route POST /api/payments/process
 * @desc Process PayHere payment transaction and create session if successful
 * @access Private
 */
//router.post('/process', authenticateToken, PaymentController.processPayment);
//router.post('/process', authenticateToken, asyncHandler());

/**
 * @route POST /api/payments/generate-link
 * @desc Generate PayHere payment link
 * @access Private
 */
router.post('/generate-link', authenticateToken, asyncHandler(generatePaymentLink));
router.post('/initiate-payment', authenticateToken, asyncHandler(processPayment));

/**
 * @route GET /api/payments/:transactionId
 * @desc Get payment details by transaction ID
 * @access Private
 */
//router.get('/:transactionId', authenticateToken, PaymentController.getPaymentByTransaction);

/**
 * @route GET /api/payments/history/:userId
 * @desc Get user's payment history
 * @access Private
 */
//router.get('/history/:userId', authenticateToken, PaymentController.getUserPaymentHistory);

/**
 * @route PUT /api/payments/:transactionId/status
 * @desc Update payment status (for PayHere webhooks)
 * @access Private
 */
//router.put('/:transactionId/status', authenticateToken, PaymentController.updatePaymentStatus);

export default router;
