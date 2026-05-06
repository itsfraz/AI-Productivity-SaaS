import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a habit title'],
    trim: true,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  streak: {
    type: Number,
    default: 0,
  },
  completionLog: [{
    type: Date // Array to track all completion dates for the Heatmap visualization
  }],
  lastCompleted: {
    type: Date,
  },
  recoveryAvailable: {
    type: Boolean,
    default: true, // Duolingo style mechanic: Users get 1 free streak freeze
  }
}, {
  timestamps: true,
});

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
