import { Request, Response } from 'express';
import { PaymentServices } from '../services/PaymentServices';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';

export const generatePaymentLink = async (req: Request, res: Response): Promise<void> => {
    const { amount, sessionType } = req.body;

    const userId = req.user!.dbUser.id; // Get user ID from authenticated request

    if (!amount || !sessionType) {
        throw new ValidationError('Amount and session type are required');
    }

    const fixedAmount = amount.toFixed(2); // Ensure amount is a fixed decimal value
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
    const { amount, currency, sessionDetails } = req.body;

    if (!amount || !currency || !sessionDetails) {
        throw new ValidationError('Amount, currency, and session details are required');
    }

    // Process the payment using the PaymentServices
    const paymentResult = await PaymentServices.addNewTransaction({
        userId: req.user!.dbUser.id, // Get user ID from authenticated request
        transactionId: '',
        paymentGateway: 'payhere',
        amount: amount,
        currency: currency,
        status: 'pending',
        paymentDate: new Date(),
    });

    const orderId = `order_${req.user!.dbUser.id}`;
    const fixedAmount = amount.toFixed(2);

    const userhash = await PaymentServices.calculatePayhereHash(
        orderId,
        fixedAmount,
        currency
    );

    ApiResponseUtil.success(res, { paymentResult, userhash }, 'Payment processed successfully');
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

    if (typeof amount !== 'number' || amount <= 0) {
        throw new ValidationError('Amount must be a positive number');
    }

    // Process the platform fee payment using the specific method
    const paymentResult = await PaymentServices.addPlatformFeeTransaction(
        req.user!.dbUser.id,
        orderId,
        amount
    );

    ApiResponseUtil.success(res, {
        transactionId: paymentResult.transactionId,
        paymentUrl: `https://sandbox.payhere.lk/pay/${orderId}`,
        orderId,
        amount,
        description: description || 'Platform access fee'
    }, 'Platform fee payment initiated successfully');
}