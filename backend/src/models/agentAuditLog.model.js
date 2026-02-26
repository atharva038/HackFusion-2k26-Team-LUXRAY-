import mongoose from 'mongoose';

/**
 * AgentAuditLog — stores every agent run for traceability and debugging.
 * Captures input, output, tool chain, duration, and status.
 */
const agentAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    userMessage: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    agentResponse: {
      type: String,
      maxlength: 5000,
    },
    // Which agents fired during this run (e.g. ['Parent_Agent', 'order_maker'])
    agentChain: {
      type: [String],
      default: [],
    },
    // Tool names that were called
    toolsUsed: {
      type: [String],
      default: [],
    },
    durationMs: {
      type: Number, // execution time in milliseconds
    },
    status: {
      type: String,
      enum: ['success', 'error', 'blocked'],
      default: 'success',
    },
    errorMessage: {
      type: String,
    },
    // Potential prompt injection attempt flag
    injectionDetected: {
      type: Boolean,
      default: false,
    },
    model: {
      type: String,
      default: 'gpt-4o',
    },
    inputTokens: Number,
    outputTokens: Number,
  },
  {
    timestamps: true,
    // Auto-expire logs after 90 days (optional, comment out to keep forever)
    // expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

// Compound index to quickly find recent logs for a user
agentAuditLogSchema.index({ userId: 1, createdAt: -1 });

const AgentAuditLog = mongoose.model('AgentAuditLog', agentAuditLogSchema);

export default AgentAuditLog;
