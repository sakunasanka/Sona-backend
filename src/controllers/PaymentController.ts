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