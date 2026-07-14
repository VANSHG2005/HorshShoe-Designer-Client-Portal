const Comment = require('../models/Comment');
const Design = require('../models/Design');
const DesignVersion = require('../models/DesignVersion');
const Activity = require('../models/Activity');
const logger = require('../utils/logger');
const { createAndEmitNotification } = require('../utils/notifier');

/**
 * Get comments for a design (optionally filtered by version)
 * GET /api/comments
 */
const getComments = async (req, res, next) => {
  try {
    const { design, version } = req.query;

    if (!design) {
      return res.status(400).json({
        success: false,
        message: 'Design ID query parameter is required',
      });
    }

    const query = { design };
    if (version && version !== 'all') {
      query.version = version;
    }

    const comments = await Comment.find(query)
      .populate('author', 'name email avatarUrl role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post a new comment or pin annotation
 * POST /api/comments
 */
const createComment = async (req, res, next) => {
  try {
    const { design: designId, version: versionId, content, type, pinnedPosition } = req.body;

    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    const comment = await Comment.create({
      design: designId,
      version: versionId,
      author: req.user._id,
      content,
      type: type || 'general',
      pinnedPosition: pinnedPosition || null,
    });

    // Record in Activity log
    await Activity.create({
      user: req.user._id,
      action: 'posted_comment',
      project: design.project,
      design: design._id,
      details: `${req.user.name} commented on "${design.title}"`,
      metadata: { commentId: comment._id, type: comment.type },
    });

    // Notify design author in real time
    if (design.createdBy && design.createdBy.toString() !== req.user._id.toString()) {
      await createAndEmitNotification({
        recipient: design.createdBy,
        sender: req.user._id,
        type: 'comment_added',
        title: 'New Design Feedback',
        message: `${req.user.name} left feedback on "${design.title}"`,
        link: '/dashboard/designs',
      });
    }

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name email avatarUrl role'
    );

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: { comment: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle resolve status for comment
 * PATCH /api/comments/:id/resolve
 */
const resolveComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    comment.isResolved = !comment.isResolved;
    comment.resolvedBy = comment.isResolved ? req.user._id : null;
    comment.resolvedAt = comment.isResolved ? new Date() : null;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name email avatarUrl role')
      .populate('resolvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: comment.isResolved ? 'Comment resolved' : 'Comment reopened',
      data: { comment: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit design approval or revision request review
 * POST /api/comments/review
 */
const submitReview = async (req, res, next) => {
  try {
    const { designId, versionId, action, notes } = req.body;

    if (!['approve', 'request_changes'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "approve" or "request_changes"',
      });
    }

    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'changes_requested';

    // 1. Update Design
    design.status = newStatus;
    await design.save();

    // 2. Update DesignVersion
    if (versionId) {
      await DesignVersion.findByIdAndUpdate(versionId, { status: newStatus });
    } else {
      await DesignVersion.findOneAndUpdate(
        { design: design._id, versionNumber: design.currentVersion },
        { status: newStatus }
      );
    }

    // 3. Create review comment
    const comment = await Comment.create({
      design: design._id,
      version: versionId || design._id,
      author: req.user._id,
      content:
        notes ||
        (action === 'approve'
          ? 'Design approved. Ready for production deliverables.'
          : 'Revision requested. Please review notes and upload updated iteration.'),
      type: action === 'approve' ? 'approval' : 'revision_request',
    });

    // 4. Log Activity
    const actAction = action === 'approve' ? 'approved_design' : 'requested_changes';
    await Activity.create({
      user: req.user._id,
      action: actAction,
      project: design.project,
      design: design._id,
      details: `${req.user.name} ${
        action === 'approve' ? 'approved' : 'requested revisions for'
      } "${design.title}"`,
      metadata: { action, notes },
    });

    logger.info(
      `Review submitted: ${req.user.email} ${actAction} on ${design.title}`
    );

    // Notify design author in real time
    if (design.createdBy) {
      await createAndEmitNotification({
        recipient: design.createdBy,
        sender: req.user._id,
        type: action === 'approve' ? 'design_approved' : 'changes_requested',
        title: action === 'approve' ? 'Design Approved! 🎉' : 'Revisions Requested ✏️',
        message: `${req.user.name} ${
          action === 'approve' ? 'approved' : 'requested revisions for'
        } "${design.title}"`,
        link: '/dashboard/designs',
      });
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name email avatarUrl role'
    );

    res.status(200).json({
      success: true,
      message:
        action === 'approve'
          ? 'Design successfully approved!'
          : 'Revisions requested and notified to the creative team.',
      data: {
        design,
        comment: populatedComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete comment
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Only comment author or admin can delete
    if (
      req.user.role !== 'admin' &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  createComment,
  resolveComment,
  submitReview,
  deleteComment,
};
