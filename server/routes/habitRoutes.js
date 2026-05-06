import express from 'express';
import { 
  getHabits, 
  createHabit, 
  logHabit, 
  deleteHabit 
} from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getHabits)
  .post(createHabit);

router.post('/:id/log', logHabit);
router.delete('/:id', deleteHabit);

export default router;
