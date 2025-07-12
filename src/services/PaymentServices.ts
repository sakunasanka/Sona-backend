import { sequelize } from "../config/db";
import PaymentMethod, { PaymentMethodCreationAttributes} from "../models/PaymentMethod";
import { ItemNotFoundError } from "../utils/errors";
import crypto from 'crypto';
import dotenv from 'dotenv';

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
            const paymentRecord = await PaymentMethod.create({
                transactionId: crypto.randomUUID(), // Generate a unique transaction ID if not provided
                userId: paymentData.userId,
                sessionData: paymentData.sessionData,
                paymentGateway: "payhere",
                amount: paymentData.amount,
                currency: paymentData.currency,
                status: "pending",
                paymentDate: new Date(),
            }, { transaction });

            const hash = PaymentServices.calculatePayhereHash(
                paymentRecord.transactionId,
                paymentRecord.amount.toFixed(2), 
                paymentRecord.currency,
            )

            return {
                payment: paymentRecord,
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
}