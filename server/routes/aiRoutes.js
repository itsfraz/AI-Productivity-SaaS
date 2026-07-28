import express from 'express';
import { chatWithAI, getConversationHistory, parseIntent, getWeeklyReports, getWeeklyReportById, breakdownTask, getFocusRecommendation } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each user to 30 requests per windowMs
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: { error: 'Too many chat requests from this user, please try again after an hour' }
});

router.use(protect);

router.post('/chat', chatLimiter, chatWithAI);
router.get('/chat/:conversationId', getConversationHistory);
router.post('/parse-intent', parseIntent);
router.get('/reports', getWeeklyReports);
router.get('/reports/:id', getWeeklyReportById);
router.post('/breakdown-task/:taskId', breakdownTask);
router.get('/focus-recommendation', getFocusRecommendation);

export default router;
