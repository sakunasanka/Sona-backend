import { sequelize } from '../config/db';
import { NotificationHelper } from '../utils/NotificationHelper';
import User from '../models/User';

/**
 * Session Reminder Script
 * This script should be run periodically (e.g., daily) to send session reminders
 * to counselors and psychiatrists for upcoming sessions.
 *
 * Usage: Run this script daily, preferably in the morning.
 */

async function sendSessionReminders() {
  try {
    console.log('Starting session reminder process...');

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Query for all scheduled sessions tomorrow
    const sessions = await sequelize.query(`
      SELECT
        s.id,
        s."counselorId",
        s."userId" as clientId,
        s.date,
        s."timeSlot",
        u.name as clientName,
        c.name as counselorName
      FROM sessions s
      JOIN users u ON s."userId" = u.id
      JOIN users c ON s."counselorId" = c.id
      WHERE s.date = $1
      AND s.status = 'scheduled'
    `, {
      bind: [tomorrowStr],
      type: 'SELECT'
    });

    console.log(`Found ${sessions.length} sessions for tomorrow`);

    // Send reminders to counselors/psychiatrists
    for (const session of sessions as any[]) {
      try {
        const counselor = await User.findByPk(session.counselorId);
        if (counselor) {
          const role = counselor.role; // Counselor or Psychiatrist

          await NotificationHelper.sessionReminderToProfessional(
            session.counselorId,
            session.clientName,
            session.date,
            session.timeSlot
          );

          console.log(`Sent reminder to ${role} ${session.counselorName} for session with ${session.clientName}`);
        }
      } catch (error) {
        console.error(`Failed to send reminder for session ${session.id}:`, error);
      }
    }

    // Also send reminders to clients (optional, based on requirements)
    for (const session of sessions as any[]) {
      try {
        const counselor = await User.findByPk(session.counselorId);
        if (counselor) {
          await NotificationHelper.sessionReminder(
            session.clientId,
            session.date,
            session.timeSlot,
            session.counselorName
          );

          console.log(`Sent reminder to client ${session.clientName} for session with ${session.counselorName}`);
        }
      } catch (error) {
        console.error(`Failed to send client reminder for session ${session.id}:`, error);
      }
    }

    console.log('Session reminder process completed successfully');

  } catch (error) {
    console.error('Error in session reminder process:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  sendSessionReminders()
    .then(() => {
      console.log('Session reminders sent successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to send session reminders:', error);
      process.exit(1);
    });
}

export { sendSessionReminders };