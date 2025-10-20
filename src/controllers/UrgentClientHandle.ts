import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { ValidationError } from '../utils/errors';
import { NotificationType } from '../models/Notification'
import User from '../models/User';

export async function handleUrgentClient(req: Request, res: Response) {
    const clientId = req.user?.dbUser.id;
    
    const { message, contactNo } = req.body
    
      if (!clientId) {
        throw new ValidationError('Client ID is required');
      }
    
    // Get all admin and management team members
    const adminAndMTMembers = await User.findAll({
        where: {
            role: ['Admin', 'MT-Team']
        },
        attributes: ['id']
    });

    // Send notification to each admin and MT member
    const notificationPromises = adminAndMTMembers.map(adminOrMT => 
        NotificationService.createNotification({
            userId: adminOrMT.id,
            type: NotificationType.DANGER,
            title: 'Urgent Appointment Request',
            message: `${message}. Contact No: ${contactNo || 'Not Provided'}`,
            relatedURL: contactNo || ''
        })
    );

    await Promise.all(notificationPromises);

    res.status(200).json({
        success: true,
        message: 'Urgent help request submitted successfully'
    });
}