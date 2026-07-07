const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [150, 'Project title cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Project code is required'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client organization is required'],
    },
    leadDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled'],
        message: '{VALUE} is not a valid project status',
      },
      default: 'planning',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
    category: {
      type: String,
      enum: [
        'Brand Identity',
        'UI/UX Design',
        '3D & Motion',
        'Packaging',
        'Marketing Campaign',
        'Design System',
        'Other',
      ],
      default: 'UI/UX Design',
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
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

projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ leadDesigner: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ title: 'text', description: 'text', code: 'text' });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
