import FocusSession from '../models/FocusSession.js';

// @desc    Log a completed focus session
// @route   POST /api/focus
// @access  Private
export const logFocusSession = async (req, res, next) => {
  try {
    const { startTime, endTime, durationInMinutes, distractionsLogged, sessionType } = req.body;

    const session = await FocusSession.create({
      user: req.user._id,
      startTime,
      endTime,
      durationInMinutes,
      distractionsLogged,
      sessionType
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Get focus session analytics for the user
// @route   GET /api/focus
// @access  Private
export const getFocusAnalytics = async (req, res, next) => {
  try {
    const sessions = await FocusSession.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    // Calculate total focus time and total distractions
    const totalFocusMinutes = sessions.reduce((acc, curr) => acc + curr.durationInMinutes, 0);
    const totalDistractions = sessions.reduce((acc, curr) => acc + curr.distractionsLogged, 0);

    res.status(200).json({
      totalSessions: sessions.length,
      totalFocusMinutes,
      totalDistractions,
      recentSessions: sessions.slice(0, 5) // Return last 5 sessions for the report
    });
  } catch (error) {
    next(error);
  }
};
