const mongoose = require('mongoose');

const designSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Design title is required'],
      trim: true,
      maxlength: [150, 'Design title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Associated project is required'],
      index: true,
    },
    category: {
      type: String,
      enum: [
        'UI Screen',
        'Brand Asset',
        'Motion Graphic',
        'Packaging',
        'Logo',
        'Marketing Graphic',
        'Illustration',
        'Other',
      ],
      default: 'UI Screen',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'changes_requested'],
      default: 'pending',
      index: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

designSchema.index({ project: 1, status: 1 });
designSchema.index({ title: 'text', description: 'text' });

const Design = mongoose.model('Design', designSchema);

module.exports = Design;
