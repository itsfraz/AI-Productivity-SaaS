import User from '../models/User.js';

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }
      
      if (req.body.preferences) {
        user.preferences = { ...user.preferences, ...req.body.preferences };
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        points: updatedUser.points,
        achievements: updatedUser.achievements,
        currentStreak: updatedUser.currentStreak
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
