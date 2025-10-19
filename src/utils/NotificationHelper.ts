import { NotificationService } from '../services/NotificationService';
import { NotificationType } from '../models/Notification';
import User from '../models/User';

/**
 * Notification Helper - Easy-to-use functions for sending notifications
 * Call these functions after successful API operations to notify users
 */

export class NotificationHelper {

  /**
   * Send session booking confirmation to client
   */
  static async sessionBooked(clientId: number, counselorName: string, sessionDate: string, sessionTime: string) {
    try {
      await NotificationService.createNotification({
        userId: clientId,
        type: NotificationType.SUCCESS,
        title: 'Session Booked Successfully',
        message: `Your counseling session with Dr. ${counselorName} has been confirmed for ${sessionDate} at ${sessionTime}.`,
        relatedURL: '/(hidden)/session/upcomingSessions'
      });
    } catch (error) {
      console.error('Failed to send session booked notification:', error);
    }
  }

  /**
   * Send session booking notification to counselor
   */
  static async sessionBookedCounselor(counselorId: number, clientName: string, sessionDate: string, sessionTime: string) {
    try {
      await NotificationService.createNotification({
        userId: counselorId,
        type: NotificationType.INFO,
        title: 'New Session Request',
        message: `You have a new counseling session request from ${clientName} for ${sessionDate} at ${sessionTime}.`,
        relatedURL: '/sessions'
      });
    } catch (error) {
      console.error('Failed to send session booked notification to counselor:', error);
    }
  }

  /**
   * Send session booking notification to psychiatrist
   */
  static async sessionBookedPsychiatrist(psychiatristId: number, clientName: string, sessionDate: string, sessionTime: string) {
    try {
      await NotificationService.createNotification({
        userId: psychiatristId,
        type: NotificationType.INFO,
        title: 'New Session Request',
        message: `You have a new psychiatry session request from ${clientName} for ${sessionDate} at ${sessionTime}.`,
        relatedURL: '/sessions'
      });
    } catch (error) {
      console.error('Failed to send session booked notification to psychiatrist:', error);
    }
  }

  /**
   * Send session cancellation notification
   */
  static async sessionCancelled(userId: number, sessionDate: string, sessionTime: string, cancelledBy: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.WARNING,
        title: 'Session Cancelled',
        message: `Your session scheduled for ${sessionDate} at ${sessionTime} has been cancelled by ${cancelledBy}.`,
        relatedURL: '/sessions/history'
      });
    } catch (error) {
      console.error('Failed to send session cancelled notification:', error);
    }
  }

  /**
   * Send session rescheduled notification
   */
  static async sessionRescheduled(userId: number, oldDate: string, oldTime: string, newDate: string, newTime: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.WARNING,
        title: 'Session Rescheduled',
        message: `Your session has been rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newTime}.`,
        relatedURL: '/sessions/calendar'
      });
    } catch (error) {
      console.error('Failed to send session rescheduled notification:', error);
    }
  }

  /**
   * Send session reminder (24 hours before)
   */
  static async sessionReminder(userId: number, sessionDate: string, sessionTime: string, professionalName: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.INFO,
        title: 'Session Reminder',
        message: `Reminder: You have a session with ${professionalName} tomorrow at ${sessionTime}.`,
        relatedURL: '/sessions'
      });
    } catch (error) {
      console.error('Failed to send session reminder notification:', error);
    }
  }

  /**
   * Send payment successful notification
   */
  static async paymentSuccessful(userId: number, amount: string, service: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.SUCCESS,
        title: 'Payment Successful',
        message: `Your payment of ${amount} for ${service} has been processed successfully.`,
        relatedURL: '/payments/history'
      });
    } catch (error) {
      console.error('Failed to send payment successful notification:', error);
    }
  }

  /**
   * Send payment failed notification
   */
  static async paymentFailed(userId: number, amount: string, service: string, reason?: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.DANGER,
        title: 'Payment Failed',
        message: `Your payment of ${amount} for ${service} failed${reason ? `: ${reason}` : ''}. Please try again.`,
        relatedURL: '/payments/retry'
      });
    } catch (error) {
      console.error('Failed to send payment failed notification:', error);
    }
  }

  /**
   * Send certification approved notification
   */
  static async certificationApproved(userId: number, certificationType: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.SUCCESS,
        title: 'Certification Approved',
        message: `Your ${certificationType} certification has been reviewed and approved by the administration.`,
        relatedURL: '/profile/certifications'
      });
    } catch (error) {
      console.error('Failed to send certification approved notification:', error);
    }
  }

  /**
   * Send certification rejected notification
   */
  static async certificationRejected(userId: number, certificationType: string, reason?: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.DANGER,
        title: 'Certification Rejected',
        message: `Your ${certificationType} certification submission was rejected${reason ? `: ${reason}` : ''}. Please resubmit with corrections.`,
        relatedURL: '/profile/certifications'
      });
    } catch (error) {
      console.error('Failed to send certification rejected notification:', error);
    }
  }

  /**
   * Send profile approval notification
   */
  static async profileApproved(userId: number, role: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.SUCCESS,
        title: 'Profile Approved',
        message: `Your ${role} profile has been reviewed and approved. You can now start accepting clients.`,
        relatedURL: '/profile'
      });
    } catch (error) {
      console.error('Failed to send profile approved notification:', error);
    }
  }

  /**
   * Send profile rejection notification
   */
  static async profileRejected(userId: number, role: string, reason?: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.DANGER,
        title: 'Profile Rejected',
        message: `Your ${role} profile submission was rejected${reason ? `: ${reason}` : ''}. Please update your information and resubmit.`,
        relatedURL: '/profile'
      });
    } catch (error) {
      console.error('Failed to send profile rejected notification:', error);
    }
  }

  /**
   * Send message notification
   */
  static async newMessage(userId: number, senderName: string, messagePreview: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.MESSAGE,
        title: 'New Message',
        message: `${senderName}: ${messagePreview}`,
        relatedURL: '/messages/inbox'
      });
    } catch (error) {
      console.error('Failed to send new message notification:', error);
    }
  }

  /**
   * Send system maintenance notification
   */
  static async systemMaintenance(userId: number, maintenanceTime: string, duration: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.WARNING,
        title: 'System Maintenance',
        message: `The counseling portal will be unavailable for maintenance on ${maintenanceTime} for ${duration}.`,
        relatedURL: '/dashboard'
      });
    } catch (error) {
      console.error('Failed to send system maintenance notification:', error);
    }
  }

  /**
   * Send PHQ-9 assessment reminder
   */
  static async phq9Reminder(userId: number) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.INFO,
        title: 'Mental Health Check-in',
        message: 'It\'s time for your regular mental health assessment. Please complete the PHQ-9 questionnaire.',
        relatedURL: '/questionnaire/phq9'
      });
    } catch (error) {
      console.error('Failed to send PHQ-9 reminder notification:', error);
    }
  }

  /**
   * Send blog post published notification (to followers)
   */
  static async blogPostPublished(userId: number, authorName: string, postTitle: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.INFO,
        title: 'New Blog Post',
        message: `${authorName} published a new blog post: "${postTitle}"`,
        relatedURL: '/blog'
      });
    } catch (error) {
      console.error('Failed to send blog post published notification:', error);
    }
  }

  /**
   * Send complaint resolved notification
   */
  static async complaintResolved(userId: number, complaintId: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type: NotificationType.SUCCESS,
        title: 'Complaint Resolved',
        message: `Your complaint (#${complaintId}) has been reviewed and resolved. Thank you for your feedback.`,
        relatedURL: '/complaints'
      });
    } catch (error) {
      console.error('Failed to send complaint resolved notification:', error);
    }
  }

  /**
   * Send custom notification (for admin use)
   */
  static async sendCustom(userId: number, type: NotificationType, title: string, message: string, relatedURL?: string) {
    try {
      await NotificationService.createNotification({
        userId,
        type,
        title,
        message,
        relatedURL
      });
    } catch (error) {
      console.error('Failed to send custom notification:', error);
    }
  }

  /**
   * Send prescription uploaded notification to client
   */
  static async prescriptionUploaded(clientId: number, psychiatristName: string) {
    try {
      await NotificationService.createNotification({
        userId: clientId,
        type: NotificationType.INFO,
        title: 'New Prescription Available',
        message: `Dr. ${psychiatristName} has uploaded a new prescription for you. Please check your prescriptions.`,
        relatedURL: '/prescriptions'
      });
    } catch (error) {
      console.error('Failed to send prescription uploaded notification:', error);
    }
  }

  /**
   * Send complaint resolved notification with reason
   */
  static async complaintResolvedWithReason(userId: number, complaintId: string, status: string, reason?: string) {
    try {
      const statusText = status === 'resolved' ? 'resolved' : 'rejected';
      const message = `Your complaint (#${complaintId}) has been ${statusText}${reason ? `. Reason: ${reason}` : ''}.`;
      
      await NotificationService.createNotification({
        userId,
        type: status === 'resolved' ? NotificationType.SUCCESS : NotificationType.WARNING,
        title: `Complaint ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        message
      });
    } catch (error) {
      console.error('Failed to send complaint resolved notification:', error);
    }
  }

  /**
   * Send new user application notification to admins and MT members
   */
  static async newUserApplication(userType: string, userName: string, userId: number) {
    try {
      // Get all admins and MT members
      const adminsAndMT = await User.findAll({
        where: {
          role: ['Admin', 'MT-Team']
        },
        attributes: ['id']
      });

      // Set related URL based on user type
      let relatedURL = `/admin/users/${userId}`;
      if (userType.toLowerCase() === 'counselor') {
        relatedURL = '/counsellor';
      } else if (userType.toLowerCase() === 'psychiatrist') {
        relatedURL = '/psychiatrist';
      }

      const notifications = adminsAndMT.map(user => 
        NotificationService.createNotification({
          userId: user.id,
          type: NotificationType.INFO,
          title: 'New User Application',
          message: `A new ${userType} (${userName}) has applied and is pending approval.`,
          relatedURL
        })
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Failed to send new user application notifications:', error);
    }
  }

  /**
   * Send student pack application notification to student
   */
  static async studentPackApplied(studentId: number) {
    try {
      await NotificationService.createNotification({
        userId: studentId,
        type: NotificationType.SUCCESS,
        title: 'Student Pack Application Submitted',
        message: 'Your student pack application has been submitted successfully. You will be notified once it\'s reviewed.'
      });
    } catch (error) {
      console.error('Failed to send student pack application notification:', error);
    }
  }

  /**
   * Send student pack application notification to admins and MT members
   */
  static async studentPackApplicationToAdmins(studentName: string, applicationId: number) {
    try {
      // Get all admins and MT members
      const adminsAndMT = await User.findAll({
        where: {
          role: ['Admin', 'MT-Team']
        },
        attributes: ['id']
      });

      const notifications = adminsAndMT.map(user => 
        NotificationService.createNotification({
          userId: user.id,
          type: NotificationType.INFO,
          title: 'New Student Pack Application',
          message: `${studentName} has applied for the student pack and is pending approval.`,
          relatedURL: `/client`
        })
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Failed to send student pack application notifications to admins:', error);
    }
  }

  /**
   * Send platform fee payment notification to student
   */
  static async platformFeePaid(studentId: number, amount: string) {
    try {
      await NotificationService.createNotification({
        userId: studentId,
        type: NotificationType.SUCCESS,
        title: 'Platform Fee Payment Successful',
        message: `Your platform fee payment of ${amount} LKR has been processed successfully. You now have access to all platform features.`,
        relatedURL: '/(hidden)/profile/view_profile'
      });
    } catch (error) {
      console.error('Failed to send platform fee payment notification:', error);
    }
  }

  /**
   * Send session reminder to counselor/psychiatrist
   */
  static async sessionReminderToProfessional(professionalId: number, clientName: string, sessionDate: string, sessionTime: string) {
    try {
      await NotificationService.createNotification({
        userId: professionalId,
        type: NotificationType.INFO,
        title: 'Upcoming Session Reminder',
        message: `You have a session with ${clientName} scheduled for ${sessionDate} at ${sessionTime}.`,
        relatedURL: '/sessions/upcoming'
      });
    } catch (error) {
      console.error('Failed to send session reminder to professional:', error);
    }
  }

  /**
   * Send new complaint notification to admins and MT members
   */
  static async newComplaintToAdmins(clientName: string, complaintId: number) {
    try {
      // Get all admins and MT members
      const adminsAndMT = await User.findAll({
        where: {
          role: ['Admin', 'MT-Team']
        },
        attributes: ['id']
      });

      const notifications = adminsAndMT.map(user => 
        NotificationService.createNotification({
          userId: user.id,
          type: NotificationType.WARNING,
          title: 'New Complaint Submitted',
          message: `${clientName} has submitted a new complaint (#${complaintId}) that requires attention.`,
          relatedURL: `/feedback`
        })
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Failed to send new complaint notifications to admins:', error);
    }
  }
}