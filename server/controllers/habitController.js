import Habit from '../models/Habit.js';

// @desc    Get all habits
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(habits);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res, next) => {
  try {
    const { title, frequency } = req.body;
    const habit = await Habit.create({
      user: req.user._id,
      title,
      frequency
    });
    res.status(201).json(habit);
  } catch (error) {
    next(error);
  }
};

// @desc    Log a habit as completed for today (Streak Engine)
// @route   POST /api/habits/:id/log
// @access  Private
export const logHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      res.status(404);
      throw new Error('Habit not found');
    }

    if (habit.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompletedDate = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
    if (lastCompletedDate) lastCompletedDate.setHours(0, 0, 0, 0);

    // If already completed today, do nothing
    if (lastCompletedDate && lastCompletedDate.getTime() === today.getTime()) {
      res.status(400);
      throw new Error('Habit already logged for today');
    }

    // Streak Logic Calculation
    let newStreak = habit.streak;
    let recoveryUsed = false;

    if (lastCompletedDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastCompletedDate.getTime() === yesterday.getTime()) {
        // Continuous streak
        newStreak += 1;
      } else {
        // Missed a day
        if (habit.recoveryAvailable) {
          // Use streak freeze
          newStreak += 1;
          habit.recoveryAvailable = false;
          recoveryUsed = true;
        } else {
          // Break streak
          newStreak = 1;
        }
      }
    } else {
      // First time completing
      newStreak = 1;
    }

    habit.streak = newStreak;
    habit.lastCompleted = new Date();
    habit.completionLog.push(new Date());
    
    await habit.save();

    res.status(200).json({ habit, recoveryUsed });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      res.status(404);
      throw new Error('Habit not found');
    }

    if (habit.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await habit.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};
