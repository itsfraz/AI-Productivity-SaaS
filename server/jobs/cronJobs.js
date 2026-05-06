import cron from 'node-cron';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const startCronJobs = () => {
  // Run every morning at 9:00 AM to send a reminder
  cron.schedule('0 9 * * *', async () => {
    try {
      const users = await User.find({});
      
      // Bulk insert notifications for all users
      const notifications = users.map(user => ({
        user: user._id,
        title: 'Daily Check-in',
        message: 'Your AI Coach has generated a new daily plan for you. Check it out!',
        type: 'reminder'
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log('Daily reminders sent to all users.');
      }
    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });

  console.log('Cron jobs initialized');
};
