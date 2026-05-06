import express from 'express';
import { generateSmartSchedule, getCoachingAdvice } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/schedule', generateSmartSchedule);
router.get('/coach', getCoachingAdvice);

export default router;
