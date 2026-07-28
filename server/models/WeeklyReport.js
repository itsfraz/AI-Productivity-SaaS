import mongoose from 'mongoose';

const weeklyReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  strength: {
    type: String,
    required: true
  },
  improvement: {
    type: String,
    required: true
  },
  suggestion: {
    type: String,
    required: true
  },
  stats: {
    tasksCompleted: { type: Number, default: 0 },
    habitsCompleted: { type: Number, default: 0 },
    focusMinutes: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
});

// Ensure uniqueness per user and week
weeklyReportSchema.index({ user: 1, weekStart: 1 }, { unique: true });

const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);
export default WeeklyReport;
