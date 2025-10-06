import { sequelize } from "../config/db";
import PaymentMethod, { PaymentMethodCreationAttributes} from "../models/PaymentMethod";
import { ItemNotFoundError } from "../utils/errors";
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET


export interface ProcessPaymentTransactionData extends PaymentMethodCreationAttributes {
    counselorId?: number;
}


export class PaymentServices {
    
    static async addNewTransaction(paymentData: PaymentMethodCreationAttributes): Promise<{
        payment: PaymentMethod;
        session?: any; // Replace with actual session type
        success: boolean;
        message: string;
        userHash: string;
    }> {
        const transaction = await sequelize.transaction();

        try {
            const transactionId = paymentData.transactionId || crypto.randomUUID();

            // Insert payment using raw SQL to match table structure
            await sequelize.query(`
                INSERT INTO payment_transactions (
                    user_id, 
                    transaction_id, 
                    payment_for, 
                    amount, 
                    currency, 
                    status, 
                    created_at, 
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, {
                bind: [
                    paymentData.userId,
                    transactionId,
                    'session_fee', // payment_for for session bookings
                    paymentData.amount,
                    paymentData.currency || 'LKR',
                    "success",
                    new Date(),
                    new Date()
                ],
                transaction
            });

            await transaction.commit();

            // Create a mock payment object for the response since we can't return the actual inserted row
            const mockPayment = {
                paymentId: 0, // Will be set by auto-increment
                userId: paymentData.userId,
                transactionId: transactionId,
                paymentGateway: "payhere" as const,
                amount: paymentData.amount,
                currency: paymentData.currency || 'LKR',
                status: "success" as const,
                paymentDate: new Date(),
                sessionData: paymentData.sessionData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const hash = PaymentServices.calculatePayhereHash(
                transactionId,
                paymentData.amount.toFixed(2), 
                paymentData.currency || 'LKR',
            )

            return {
                payment: mockPayment as unknown as PaymentMethod,
                success: true,
                message: "Payment transaction created successfully",
                userHash: hash          
            }
        }catch (error: any) {
            await transaction.rollback();
            throw new Error(`Payment processing failed: ${error.message}`);
        }
    }

    static async updatePaymentStatus(
        transactionId: string,
        status: 'pending' | 'completed' | 'failed' | 'refunded',
        gatewayResponse?: any
    ): Promise<PaymentMethod> {
        const payment = await PaymentMethod.findOne({
            where: { transactionId }
        });

        if (!payment) {
            throw new ItemNotFoundError(`Payment with transaction ID ${transactionId} not found`);
        }

        payment.status = status;
        payment.gatewayResponse = gatewayResponse || null;
        payment.paymentDate = new Date();

        await payment.save();

        return payment;
    }

    static async getPaymentByTransactionId(transactionId: string): Promise<PaymentMethod | null> {
        return PaymentMethod.findByTransactionId(transactionId);
    }

    static async getPaymentsByUserId(userId: number): Promise<PaymentMethod[]> {
        return PaymentMethod.findByUserId(userId);
    }

    static async getCompletedPayments(): Promise<PaymentMethod[]> {
        return PaymentMethod.findCompletedPayments();
    }

    static async getPaymentStats(userId?: number) {
        return PaymentMethod.getPaymentStats(userId);
    }

    static calculatePayhereHash = (orderId: string, amountString: string, currency: string) => {
        const merchantId = PAYHERE_MERCHANT_ID
        const merchantSecretPlaintext = PAYHERE_MERCHANT_SECRET
        if(!merchantId || !merchantSecretPlaintext) {
            throw new Error("PayHere merchant ID or secret is not configured properly.");
        }
        const merchantSecretMd5 = crypto.createHash('md5').update(merchantSecretPlaintext).digest('hex').toUpperCase(); 
        console.log("Merchant Secret MD5:", merchantSecretMd5); 
        
        const hashString = `${merchantId}${orderId}${amountString}${currency}${merchantSecretMd5}`;

        console.log("Hash String:", hashString); // Debugging output
        return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
    }

    static async checkPlatformFeeStatus(userId: number): Promise<{
        hasPaid: boolean;
        paymentDate?: Date;
        expiryDate?: Date;
        daysRemaining?: number;
        message?: string;
    }> {
        const currentDate = new Date();

        // Find the most recent successful platform fee payment
        const platformFeePayments = await sequelize.query(`
            SELECT * FROM payment_transactions
            WHERE user_id = $1
            AND status = 'success'
            AND payment_for = 'platform_fee'
            ORDER BY created_at DESC
            LIMIT 1
        `, {
            bind: [userId],
            type: 'SELECT'
        });

        const platformFeePayment = platformFeePayments[0] as any;

        if (!platformFeePayment) {
            return {
                hasPaid: false,
                message: "Platform fee payment required"
            };
        }

        // Check if the payment is still valid (within 30 days)
        const paymentDate = new Date(platformFeePayment.created_at);
        const expiryDate = new Date(paymentDate);
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

        if (currentDate > expiryDate) {
            return {
                hasPaid: false,
                message: "Platform fee payment expired"
            };
        }

        // Calculate days remaining
        const timeDiff = expiryDate.getTime() - currentDate.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        return {
            hasPaid: true,
            paymentDate,
            expiryDate,
            daysRemaining,
            message: "Platform fee payment is valid"
        };
    }

    static async addPlatformFeeTransaction(userId: number, orderId: string, amount: number, month?: string): Promise<{
        success: boolean;
        message: string;
        transactionId: string;
    }> {
        const transaction = await sequelize.transaction();

        try {
            const transactionId = orderId;
            const paymentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format

            // Insert platform fee payment using raw SQL to match table structure
            await sequelize.query(`
                INSERT INTO payment_transactions (
                    user_id, 
                    transaction_id, 
                    payment_for, 
                    amount, 
                    currency, 
                    status, 
                    created_at, 
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, {
                bind: [
                    userId,
                    transactionId,
                    'platform_fee',
                    amount,
                    'LKR',
                    'success',
                    new Date(),
                    new Date()
                ],
                transaction
            });

            await transaction.commit();

            return {
                success: true,
                message: "Platform fee payment transaction created successfully",
                transactionId
            };
        } catch (error: any) {
            await transaction.rollback();
            throw new Error(`Platform fee payment processing failed: ${error.message}`);
        }
    }
}