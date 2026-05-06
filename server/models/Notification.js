import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'achievement', 'alert', 'system'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String // Optional link to redirect user when clicked
  }
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
