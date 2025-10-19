import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { ValidationError } from '../utils/errors';
import { NotificationType } from '../models/Notification'

export async function handleUrgentClient(req: Request, res: Response) {
    const clientId = req.user?.dbUser.id;
    
    const { message, contactNo } = req.body
    
      if (!clientId) {
        throw new ValidationError('Client ID is required');
      }
    
    await NotificationService.createNotification({
        userId: parseInt(clientId.toString()),
        type: NotificationType.DANGER,
        title: 'Urgent Appointment Request',
        message: message || 'A client has requested urgent help. Please respond as soon as possible.',
        relatedURL: contactNo || ''
    });

    res.status(200).json({
        success: true,
        message: 'Urgent help request submitted successfully'
    });
}