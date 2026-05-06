import express from 'express';
import { logFocusSession, getFocusAnalytics } from '../controllers/focusController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(logFocusSession)
  .get(getFocusAnalytics);

export default router;
