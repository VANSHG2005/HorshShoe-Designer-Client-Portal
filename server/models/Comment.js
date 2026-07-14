const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: [true, 'Associated design is required'],
      index: true,
    },
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DesignVersion',
      required: [true, 'Associated design version is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['general', 'approval', 'revision_request'],
      default: 'general',
    },
    pinnedPosition: {
      x: { type: Number, default: null },
      y: { type: Number, default: null },
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ design: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
