import express from 'express';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  toggleSubtaskCompletion
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All task routes are protected
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/subtasks/:subtaskId', toggleSubtaskCompletion);

export default router;
