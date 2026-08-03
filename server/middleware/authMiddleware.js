import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Simple in-memory cache for user lookups to avoid DB hit on every request
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedUser = (userId) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  userCache.delete(userId);
  return null;
};

const setCachedUser = (userId, user) => {
  // Prevent unbounded growth
  if (userCache.size > 1000) {
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
  userCache.set(userId, { user, timestamp: Date.now() });
};

// Export for use when user data changes (logout, profile update)
export const invalidateUserCache = (userId) => {
  userCache.delete(userId.toString());
};

export const protect = async (req, res, next) => {
  let token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check cache first
      let user = getCachedUser(decoded.userId);
      if (!user) {
        // Cache miss — hit DB and cache the result
        user = await User.findById(decoded.userId).select('-password').lean();
        if (user) {
          setCachedUser(decoded.userId, user);
        }
      }
      
      if (!user) {
        res.status(401);
        return next(new Error('Not authorized, user not found'));
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};
