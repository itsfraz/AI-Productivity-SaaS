import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true // Optimize queries by user
  },
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  category: {
    type: String,
    default: 'General'
  },
  deadline: {
    type: Date,
  },
  aiOptimized: {
    type: Boolean,
    default: false,
  },
  subtasks: [{
    title: { type: String, required: true },
    estimatedMinutes: { type: Number },
    completed: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
});

// Compound index for the most common query: tasks by user, sorted by deadline
taskSchema.index({ user: 1, status: 1, deadline: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
