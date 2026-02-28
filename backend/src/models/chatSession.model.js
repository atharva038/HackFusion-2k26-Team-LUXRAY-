import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [messageSchema],
    // Distinguishes customer chat sessions from pharmacist agent sessions.
    // Existing documents without this field behave as 'customer' (default).
    agentType: {
      type: String,
      enum: ['customer', 'pharmacist'],
      default: 'customer',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatSession', chatSessionSchema);
