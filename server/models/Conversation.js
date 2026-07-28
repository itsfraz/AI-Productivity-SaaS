import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'model', 'system', 'function'],
      required: true
    },
    parts: [{
      text: { type: String },
      functionCall: { type: Object },
      functionResponse: { type: Object }
    }]
  }]
}, {
  timestamps: true,
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
