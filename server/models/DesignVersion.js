const mongoose = require('mongoose');

const designVersionSchema = new mongoose.Schema(
  {
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: [true, 'Design reference is required'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or path is required'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      default: '',
    },
    changelog: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'changes_requested'],
      default: 'pending',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

designVersionSchema.index({ design: 1, versionNumber: 1 }, { unique: true });

const DesignVersion = mongoose.model('DesignVersion', designVersionSchema);

module.exports = DesignVersion;
