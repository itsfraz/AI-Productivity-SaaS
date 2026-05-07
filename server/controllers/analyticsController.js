import Task from '../models/Task.js';
import Habit from '../models/Habit.js';

// @desc    Get comprehensive user analytics
// @route   GET /api/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Use aggregation pipeline instead of fetching all docs into memory
    const [taskStats, habitData] = await Promise.all([
      Task.aggregate([
        { $match: { user: userId } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalTasks: { $sum: 1 },
                  completedTasks: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                  },
                  overdueTasks: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ['$status', 'completed'] },
                            { $ne: ['$deadline', null] },
                            { $lt: ['$deadline', new Date()] }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  activeTasks: {
                    $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] }
                  }
                }
              }
            ]
          }
        }
      ]),
      Habit.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalHabits: { $sum: 1 },
            totalStreaks: { $sum: '$streak' }
          }
        }
      ])
    ]);

    // Extract results
    const stats = taskStats[0]?.totals[0] || { totalTasks: 0, completedTasks: 0, overdueTasks: 0, activeTasks: 0 };
    const habits = habitData[0] || { totalHabits: 0, totalStreaks: 0 };

    const { totalTasks, completedTasks, overdueTasks, activeTasks: activeTasksCount } = stats;
    const { totalHabits, totalStreaks } = habits;

    // 2. Calculate Productivity Score (0-100)
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const habitConsistency = totalHabits > 0 ? Math.min((totalStreaks / (totalHabits * 7)) * 100, 100) : 0;
    const productivityScore = Math.round((taskCompletionRate * 0.6) + (habitConsistency * 0.4));

    // 3. Burnout Detection Logic
    let burnoutRisk = 'Low';
    let burnoutMessage = 'You are maintaining a healthy pace.';
    
    if (overdueTasks > 5 || (activeTasksCount > 20 && taskCompletionRate < 30)) {
      burnoutRisk = 'High';
      burnoutMessage = 'Warning: High cognitive load detected. Consider deferring non-essential tasks and taking a break.';
    } else if (overdueTasks > 2 || activeTasksCount > 10) {
      burnoutRisk = 'Moderate';
      burnoutMessage = 'You have a growing backlog. Try using Focus Mode to clear small tasks.';
    }

    // 4. Weekly Trend Analysis
    // In a production app, we would query the FocusSession collection for daily aggregates.
    // For now, we return empty so the UI shows 0s for new users.
    const weeklyFocusData = [];

    res.status(200).json({
      productivityScore,
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        activeHabits: totalHabits,
        totalStreaks
      },
      burnout: {
        riskLevel: burnoutRisk,
        message: burnoutMessage
      },
      trends: weeklyFocusData
    });
    
  } catch (error) {
    next(error);
  }
};
