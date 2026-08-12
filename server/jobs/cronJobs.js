import cron from 'node-cron';
import { fromZonedTime } from 'date-fns-tz';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import WeeklyReport from '../models/WeeklyReport.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import FocusSession from '../models/FocusSession.js';
import { callAI } from '../config/ai.js';

const generateWeeklyReport = async (user, weekStart, weekEnd) => {
  try {
    // Check idempotency
    const existing = await WeeklyReport.findOne({ user: user._id, weekStart });
    if (existing) return;

    // Aggregate stats
    const tasksCompleted = await Task.countDocuments({
      user: user._id,
      status: 'completed',
      updatedAt: { $gte: weekStart, $lte: weekEnd }
    });

    const focusSessions = await FocusSession.find({
      user: user._id,
      startTime: { $gte: weekStart, $lte: weekEnd }
    });
    const focusMinutes = focusSessions.reduce((sum, s) => sum + s.durationInMinutes, 0);

    const habitsCompleted = await Habit.countDocuments({
      user: user._id,
      updatedAt: { $gte: weekStart, $lte: weekEnd }
    });

    const stats = {
      tasksCompleted,
      habitsCompleted,
      focusMinutes,
      productivityScore: user.productivityScore || 0
    };

    let reportData = {
      summary: "You didn't record any activity this week. Remember, every small step counts!",
      strength: "Taking time to rest.",
      improvement: "Try to log at least one task or habit next week.",
      suggestion: "Start with something small, like a 10-minute focus session."
    };

    if (tasksCompleted > 0 || focusMinutes > 0 || habitsCompleted > 0) {
      const prompt = `
You are an AI productivity coach analyzing a user's weekly performance.
Here are their stats for the past 7 days:
- Tasks Completed: ${tasksCompleted}
- Habits Actively Tracked/Completed: ${habitsCompleted}
- Focus Time: ${focusMinutes} minutes
- Current Overall Productivity Score: ${stats.productivityScore}

Analyze this data and return a JSON object exactly matching this schema:
{
  "summary": "A 2-3 sentence summary of their week.",
  "strength": "One specific strength based on the numbers.",
  "improvement": "One specific area to improve.",
  "suggestion": "A suggested focus or goal for next week."
}
      `;

      try {
        const response = await callAI({
          messages: [{ role: "user", content: prompt }],
          enable_thinking: true,
          temperature: 0.7
        });
        const rawText = response.choices[0].message.content;
        const parsed = JSON.parse(rawText);
        reportData = {
          summary: parsed.summary || reportData.summary,
          strength: parsed.strength || reportData.strength,
          improvement: parsed.improvement || reportData.improvement,
          suggestion: parsed.suggestion || reportData.suggestion,
        };
      } catch (err) {
        console.error(`AI generation failed for user ${user._id}:`, err);
        reportData.summary = `You completed ${tasksCompleted} tasks and focused for ${focusMinutes} minutes.`;
      }
    }

    await WeeklyReport.create({
      user: user._id,
      weekStart,
      weekEnd,
      summary: reportData.summary,
      strength: reportData.strength,
      improvement: reportData.improvement,
      suggestion: reportData.suggestion,
      stats
    });

    await Notification.create({
      user: user._id,
      title: 'Weekly Report Ready',
      message: 'Your AI-generated weekly retrospective is ready! Check it out in Analytics.',
      type: 'achievement',
      actionUrl: '/analytics'
    });

  } catch (error) {
    console.error(`Failed to generate report for user ${user._id}:`, error);
  }
};

export const startCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Starting hourly check for timezone-aware morning notifications...');
      const users = await User.find({});
      let sentCount = 0;

      for (const user of users) {
        const userTz = user.preferences?.timezone || 'UTC';
        
        let currentHour;
        let dateParts;
        try {
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: userTz, hour: 'numeric', hour12: false });
          currentHour = parseInt(formatter.format(new Date()), 10);
          dateParts = new Intl.DateTimeFormat('en-US', { timeZone: userTz, year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date());
        } catch (e) {
          console.error(`Invalid timezone for user ${user._id}: ${userTz}`);
          continue;
        }

        if (currentHour !== 9) {
          continue;
        }

        // Get the exact UTC boundaries for their local day
        const [month, day, year] = dateParts.split('/');
        const isoBase = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const todayStart = fromZonedTime(`${isoBase}T00:00:00.000`, userTz);
        const todayEnd = fromZonedTime(`${isoBase}T23:59:59.999`, userTz);

        const pendingTasksCount = await Task.countDocuments({
          user: user._id,
          status: { $ne: 'completed' },
          deadline: { $lte: todayEnd }
        });

        const pendingHabitsCount = await Habit.countDocuments({
          user: user._id,
          $or: [
            { lastCompleted: { $lt: todayStart } },
            { lastCompleted: null }
          ]
        });

        if (pendingTasksCount > 0 || pendingHabitsCount > 0) {
          let message = 'Good morning! ';
          if (pendingTasksCount > 0 && pendingHabitsCount > 0) {
            message += `You have ${pendingTasksCount} tasks due and ${pendingHabitsCount} habits to complete today.`;
          } else if (pendingTasksCount > 0) {
            message += `You have ${pendingTasksCount} tasks to tackle today.`;
          } else {
            message += `You have ${pendingHabitsCount} habits to complete today.`;
          }
          message += ' Let\'s make it a productive day!';

          await Notification.create({
            user: user._id,
            title: 'Daily Check-in',
            message: message,
            type: 'reminder',
            actionUrl: '/'
          });
          sentCount++;
        }
      }
      if (sentCount > 0) {
        console.log(`Daily reminders sent to ${sentCount} users for their 9 AM local time.`);
      }
    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Starting hourly AI nudge check...');
      const users = await User.find({ 'preferences.notifications': true });
      const now = Date.now();
      
      for (const user of users) {
        // Cooldown: 3 hours
        if (user.lastAINudge && (now - user.lastAINudge.getTime()) < 3 * 60 * 60 * 1000) {
          continue;
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Signal 1: Overdue tasks
        const overdueTasksCount = await Task.countDocuments({
          user: user._id,
          status: { $ne: 'completed' },
          deadline: { $lt: new Date() }
        });

        // Signal 2: Habits at risk (active streak, but not logged today)
        const habitsAtRisk = await Habit.countDocuments({
          user: user._id,
          currentStreak: { $gt: 0 },
          lastCompleted: { $lt: todayStart }
        });

        // Signal 3: No focus session today
        const focusTodayCount = await FocusSession.countDocuments({
          user: user._id,
          startTime: { $gte: todayStart, $lte: todayEnd }
        });

        const signals = [];
        if (overdueTasksCount > 0) signals.push(`${overdueTasksCount} tasks are overdue`);
        if (habitsAtRisk > 0) signals.push(`${habitsAtRisk} habits are at risk of losing their streak`);
        if (focusTodayCount === 0) signals.push(`No focus sessions logged today`);

        if (signals.length > 0) {
          const prompt = `
You are an AI productivity coach. The user has the following context right now:
- ${signals.join('\n- ')}

Write ONE short, encouraging, non-generic nudge message for this user tied to this specific situation.
It MUST be under 20 words. No quotes around the response.
          `;

          try {
            const response = await callAI({
              messages: [{ role: "user", content: prompt }],
              enable_thinking: true,
              temperature: 0.7
            });
            const message = response.choices[0].message.content.trim();

            await Notification.create({
              user: user._id,
              title: 'A quick nudge from AI',
              message: message,
              type: 'ai_nudge',
              actionUrl: '/tasks'
            });

            user.lastAINudge = now;
            await user.save();
          } catch (err) {
            console.error(`Failed to generate AI nudge for user ${user._id}:`, err);
          }
        }
      }
    } catch (error) {
      console.error('Error in hourly cron job:', error);
    }
  });

  cron.schedule('0 23 * * 0', async () => {
    try {
      console.log('Starting weekly retrospective generation...');
      const users = await User.find({});
      const weekEnd = new Date();
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);

      for (const user of users) {
        await generateWeeklyReport(user, weekStart, weekEnd);
      }
      console.log('Weekly retrospectives completed.');
    } catch (error) {
      console.error('Error in weekly cron job:', error);
    }
  });

  console.log('Cron jobs initialized');
};
