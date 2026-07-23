const path = require('path');
const fs = require('fs');
const Design = require('../models/Design');
const DesignVersion = require('../models/DesignVersion');
const Project = require('../models/Project');
const logger = require('../utils/logger');
const getAccessibleProjectIds = require('../utils/roleScope');

/**
 * Get designs with filtering and role scoping
 * GET /api/designs
 */
const getDesigns = async (req, res, next) => {
  try {
    const { project, status, category, search } = req.query;
    const query = {};

    const accessibleIds = await getAccessibleProjectIds(req.user);
    if (accessibleIds !== null) {
      query.project = { $in: accessibleIds };
    }

    if (project && project !== 'all') {
      if (accessibleIds !== null) {
        const isAllowed = accessibleIds.some((id) => id.toString() === project);
        if (!isAllowed) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this project',
          });
        }
      }
      query.project = project;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      const searchOr = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const designs = await Design.find(query)
      .populate('project', 'title code client')
      .populate('createdBy', 'name email avatarUrl role')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { designs },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get design by ID with full version history
 * GET /api/designs/:id
 */
const getDesignById = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id)
      .populate('project', 'title code client leadDesigner team')
      .populate('createdBy', 'name email avatarUrl')
      .lean();

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    const versions = await DesignVersion.find({ design: design._id })
      .populate('uploadedBy', 'name email avatarUrl role')
      .sort({ versionNumber: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        design,
        versions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new design with initial version (v1)
 * POST /api/designs
 */
const createDesign = async (req, res, next) => {
  try {
    const { title, description, project: projectId, category } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Design deliverable file is required for initial version',
      });
    }

    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const fileUrl = `/uploads/designs/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');

    // 1. Create Design
    const design = await Design.create({
      title,
      description: description || '',
      project: projectId,
      category: category || 'UI Screen',
      status: 'pending',
      currentVersion: 1,
      thumbnailUrl: isImage ? fileUrl : '',
      createdBy: req.user._id,
    });

    // 2. Create initial DesignVersion (v1)
    const version = await DesignVersion.create({
      design: design._id,
      versionNumber: 1,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      changelog: 'Initial version uploaded',
      status: 'pending',
      uploadedBy: req.user._id,
    });

    logger.info(`Design created: ${design.title} v1 for ${projectDoc.code} by ${req.user.email}`);

    const populated = await Design.findById(design._id)
      .populate('project', 'title code client')
      .populate('createdBy', 'name email avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Design uploaded successfully',
      data: {
        design: populated,
        version,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a new version for an existing design
 * POST /api/designs/:id/versions
 */
const uploadNewVersion = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Design file is required for new version upload',
      });
    }

    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    const nextVersionNumber = (design.currentVersion || 1) + 1;
    const fileUrl = `/uploads/designs/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');

    const version = await DesignVersion.create({
      design: design._id,
      versionNumber: nextVersionNumber,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      changelog: req.body.changelog || `Version ${nextVersionNumber} update`,
      status: 'pending',
      uploadedBy: req.user._id,
    });

    // Update parent design
    design.currentVersion = nextVersionNumber;
    design.status = 'in_review';
    if (isImage) {
      design.thumbnailUrl = fileUrl;
    }
    await design.save();

    logger.info(`New version uploaded: ${design.title} v${nextVersionNumber} by ${req.user.email}`);

    const populatedVersion = await DesignVersion.findById(version._id).populate(
      'uploadedBy',
      'name email avatarUrl role'
    );

    res.status(201).json({
      success: true,
      message: `Version ${nextVersionNumber} uploaded successfully`,
      data: {
        design,
        version: populatedVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update design status (e.g. approved, changes_requested)
 * PATCH /api/designs/:id/status
 */
const updateDesignStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    design.status = status;
    await design.save();

    // Also update current version status
    await DesignVersion.findOneAndUpdate(
      { design: design._id, versionNumber: design.currentVersion },
      { status }
    );

    logger.info(`Design ${design.title} status updated to: ${status}`);

    res.status(200).json({
      success: true,
      message: `Design marked as ${status.replace('_', ' ')}`,
      data: { design },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete design and all versions
 * DELETE /api/designs/:id
 */
const deleteDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Remove version records and files
    const versions = await DesignVersion.find({ design: design._id });
    for (const v of versions) {
      if (v.fileUrl && v.fileUrl.startsWith('/uploads/designs/')) {
        const filePath = path.join(__dirname, '..', v.fileUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            logger.warn(`Could not delete file ${filePath}: ${err.message}`);
          }
        }
      }
    }

    await DesignVersion.deleteMany({ design: design._id });
    await Design.findByIdAndDelete(req.params.id);

    logger.info(`Design deleted: ${design.title} (${req.params.id}) by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Design and all version assets removed successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get design statistics (role-scoped)
 * GET /api/designs/stats
 */
const getDesignStats = async (req, res, next) => {
  try {
    const query = {};
    const accessibleIds = await getAccessibleProjectIds(req.user);
    if (accessibleIds !== null) {
      query.project = { $in: accessibleIds };
    }

    const [total, pending, inReview, approved, changesRequested] = await Promise.all([
      Design.countDocuments(query),
      Design.countDocuments({ ...query, status: 'pending' }),
      Design.countDocuments({ ...query, status: 'in_review' }),
      Design.countDocuments({ ...query, status: 'approved' }),
      Design.countDocuments({ ...query, status: 'changes_requested' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          inReview,
          approved,
          changesRequested,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDesigns,
  getDesignById,
  createDesign,
  uploadNewVersion,
  updateDesignStatus,
  deleteDesign,
  getDesignStats,
};
