import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationInMinutes: {
    type: Number,
    required: true
  },
  distractionsLogged: {
    type: Number,
    default: 0
  },
  sessionType: {
    type: String,
    enum: ['pomodoro', 'deep_work'],
    default: 'pomodoro'
  }
}, {
  timestamps: true,
});

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
export default FocusSession;
