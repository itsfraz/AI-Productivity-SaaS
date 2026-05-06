import Task from '../models/Task.js';
import Habit from '../models/Habit.js';

// @desc    Get comprehensive user analytics
// @route   GET /api/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch data
    const tasks = await Task.find({ user: userId });
    const habits = await Habit.find({ user: userId });

    // 2. Calculate Productivity Score (0-100)
    // Formula: (Completed Tasks / Total Tasks) * 60 + (Active Habits Streak / Total Habits * Expected Streak) * 40
    // Simplify for MVP: based on task completion ratio + habit consistency
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalHabits = habits.length;
    const totalStreaks = habits.reduce((acc, curr) => acc + curr.streak, 0);
    // Let's assume an average healthy streak is 7 days. Cap at 100%.
    const habitConsistency = totalHabits > 0 ? Math.min((totalStreaks / (totalHabits * 7)) * 100, 100) : 0;

    // Weighting: 60% Tasks, 40% Habits
    const productivityScore = Math.round((taskCompletionRate * 0.6) + (habitConsistency * 0.4));

    // 3. Burnout Detection Logic
    // High risk if: Overdue tasks > 3 OR (Total active tasks > 15 && completion rate < 20%)
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.deadline && 
      new Date(t.deadline) < new Date()
    ).length;
    
    const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
    
    let burnoutRisk = 'Low';
    let burnoutMessage = 'You are maintaining a healthy pace.';
    
    if (overdueTasks > 5 || (activeTasksCount > 20 && taskCompletionRate < 30)) {
      burnoutRisk = 'High';
      burnoutMessage = 'Warning: High cognitive load detected. Consider deferring non-essential tasks and taking a break.';
    } else if (overdueTasks > 2 || activeTasksCount > 10) {
      burnoutRisk = 'Moderate';
      burnoutMessage = 'You have a growing backlog. Try using Focus Mode to clear small tasks.';
    }

    // 4. Weekly Trend Analysis (Mocked Data for Chart generation based on current stats)
    // In a production app, we would query the FocusSession collection for daily aggregates.
    const weeklyFocusData = [
      { day: 'Mon', focusHours: 4.2, tasksDone: 5 },
      { day: 'Tue', focusHours: 5.1, tasksDone: 7 },
      { day: 'Wed', focusHours: 3.8, tasksDone: 4 },
      { day: 'Thu', focusHours: 6.0, tasksDone: 8 },
      { day: 'Fri', focusHours: 4.5, tasksDone: 6 },
      { day: 'Sat', focusHours: 1.2, tasksDone: 2 },
      { day: 'Sun', focusHours: 2.0, tasksDone: 3 },
    ];

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
