import { Request, Response } from 'express';
import { PaymentServices } from '../services/PaymentServices';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';
import { NotificationHelper } from '../utils/NotificationHelper';

// Helper function to get current date with +05:30 offset
const getCurrentDatePlus0530 = () => new Date(Date.now() + (5.5 * 60 * 60 * 1000));

export const generatePaymentLink = async (req: Request, res: Response): Promise<void> => {
    const { amount, sessionType } = req.body;

    const userId = req.user!.dbUser.id; // Get user ID from authenticated request

    if (!amount || !sessionType) {
        throw new ValidationError('Amount and session type are required');
    }

    // Ensure amount is a number before calling toFixed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new ValidationError('Amount must be a valid positive number');
    }

    const fixedAmount = numericAmount.toFixed(2); // Ensure amount is a fixed decimal value
    console.log(`Generating payment link for user ${userId} with amount ${fixedAmount} LKR`);
    const orderId = `order_${userId}`;
    const currency = "LKR";

    // Generate the payment link
    const userhash = await PaymentServices.calculatePayhereHash(
        orderId,
        fixedAmount,
        currency
    );

    ApiResponseUtil.success(res, { userhash, orderId }, 'Payment link generated successfully');
}

export const processPayment = async (req: Request, res: Response): Promise<void> => {
    const { orderId, userhash, sessionDetails } = req.body;

    if (!orderId || !userhash || !sessionDetails) {
        throw new ValidationError('Order ID, user hash, and session details are required');
    }

    if (!sessionDetails.amount || !sessionDetails.counselorId || !sessionDetails.date || !sessionDetails.time || !sessionDetails.duration) {
        throw new ValidationError('Session details must include amount, counselorId, date, time, and duration');
    }

    // Ensure amount is a number
    const numericAmount = typeof sessionDetails.amount === 'string' ? parseFloat(sessionDetails.amount) : Number(sessionDetails.amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new ValidationError('Session amount must be a positive number');
    }

    // Process the payment using the PaymentServices
    const paymentResult = await PaymentServices.addNewTransaction({
        userId: req.user!.dbUser.id, // Get user ID from authenticated request
        transactionId: orderId,
        paymentGateway: 'payhere',
        amount: numericAmount,
        currency: 'LKR',
        status: 'pending',
        paymentDate: getCurrentDatePlus0530(),
    });

    ApiResponseUtil.success(res, {
        paymentResult,
        userhash,
        orderId,
        sessionDetails
    }, 'Payment processed successfully');
}

export const checkPlatformFeeStatus = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.dbUser.id;

    // Check if user has valid platform fee payment (within 30 days)
    const platformFeeStatus = await PaymentServices.checkPlatformFeeStatus(userId);

    ApiResponseUtil.success(res, platformFeeStatus, 'Platform fee status retrieved successfully');
}

export const initiatePlatformFeePayment = async (req: Request, res: Response): Promise<void> => {
    const { orderId, userhash, amount, description } = req.body;

    if (!orderId || !userhash || !amount) {
        throw new ValidationError('Order ID, user hash, and amount are required');
    }

    // Ensure amount is a number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new ValidationError('Amount must be a positive number');
    }

    // Process the platform fee payment using the specific method
    const paymentResult = await PaymentServices.addPlatformFeeTransaction(
        req.user!.dbUser.id,
        orderId,
        numericAmount
    );

    // Send notification to student
    try {
      await NotificationHelper.platformFeePaid(req.user!.dbUser.id, numericAmount.toFixed(2));
    } catch (notificationError) {
      console.error('Failed to send platform fee payment notification:', notificationError);
      // Don't fail the payment if notification fails
    }

    ApiResponseUtil.success(res, {
        transactionId: paymentResult.transactionId,
        paymentUrl: `https://sandbox.payhere.lk/pay/${orderId}`,
        orderId,
        amount: numericAmount,
        description: description || 'Platform access fee'
    }, 'Platform fee payment initiated successfully');
}