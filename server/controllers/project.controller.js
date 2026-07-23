const Project = require('../models/Project');
const logger = require('../utils/logger');

/**
 * Build role-scoped query filter for projects
 */
const buildRoleScope = (user) => {
  if (user.role === 'admin' || user.role === 'project_manager') {
    return {};
  }
  if (user.role === 'designer') {
    return {
      $or: [{ leadDesigner: user._id }, { team: user._id }],
    };
  }
  if (user.role === 'client') {
    if (!user.clientCompany) {
      // Client has no company assigned yet
      return { client: null };
    }
    return { client: user.clientCompany };
  }
  return { _id: null }; // Default block
};

/**
 * Get projects with role scoping, filtering, and pagination
 * GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      category,
      client,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const roleScope = buildRoleScope(req.user);
    const query = { ...roleScope };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (client && client !== 'all') {
      query.client = client;
    }

    if (search) {
      const searchOr = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        // Combine role-scope $or with search $or using $and
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('client', 'name company email logoUrl')
        .populate('leadDesigner', 'name email avatarUrl')
        .populate('team', 'name email avatarUrl')
        .populate('createdBy', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single project by ID with authorization check
 * GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name company email phone website address logoUrl')
      .populate('leadDesigner', 'name email avatarUrl specializations phone')
      .populate('team', 'name email avatarUrl specializations')
      .populate('createdBy', 'name email')
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Role-based visibility check
    if (req.user.role === 'designer') {
      const isAssigned =
        project.leadDesigner?._id?.toString() === req.user._id.toString() ||
        project.team?.some((m) => m._id?.toString() === req.user._id.toString());
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this project',
        });
      }
    } else if (req.user.role === 'client') {
      if (!req.user.clientCompany || project.client?._id?.toString() !== req.user.clientCompany.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this project',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project (admin or project_manager)
 * POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    const {
      title,
      code,
      description,
      client,
      leadDesigner,
      team,
      status,
      priority,
      category,
      budget,
      spent,
      progress,
      startDate,
      deadline,
      tags,
    } = req.body;

    // Generate unique code if not provided
    let projectCode = code;
    if (!projectCode) {
      const count = await Project.countDocuments();
      projectCode = `HSS-${String(count + 101).padStart(3, '0')}`;
    }

    const project = await Project.create({
      title,
      code: projectCode.toUpperCase(),
      description,
      client,
      leadDesigner: leadDesigner || null,
      team: team || [],
      status: status || 'planning',
      priority: priority || 'medium',
      category: category || 'UI/UX Design',
      budget: budget || 0,
      spent: spent || 0,
      progress: progress || 0,
      startDate: startDate || new Date(),
      deadline: deadline || null,
      tags: tags || [],
      createdBy: req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('client', 'name company email')
      .populate('leadDesigner', 'name email')
      .populate('team', 'name email');

    logger.info(`Project created: ${project.title} (${project.code}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: populatedProject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project
 * PUT /api/projects/:id
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Role check: Lead designers can update progress/status; Admins/PMs can update everything
    if (req.user.role === 'designer') {
      const isLead = project.leadDesigner?.toString() === req.user._id.toString();
      if (!isLead) {
        return res.status(403).json({
          success: false,
          message: 'Only the project lead designer or an admin can update this project',
        });
      }
    }

    const {
      title,
      code,
      description,
      client,
      leadDesigner,
      team,
      status,
      priority,
      category,
      budget,
      spent,
      progress,
      startDate,
      deadline,
      tags,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (client !== undefined) updateData.client = client;
    if (leadDesigner !== undefined) updateData.leadDesigner = leadDesigner || null;
    if (team !== undefined) updateData.team = team;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed' && !project.completedAt) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (budget !== undefined) updateData.budget = budget;
    if (spent !== undefined) updateData.spent = spent;
    if (progress !== undefined) updateData.progress = progress;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (tags !== undefined) updateData.tags = tags;

    const updated = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'name company email')
      .populate('leadDesigner', 'name email avatarUrl')
      .populate('team', 'name email avatarUrl');

    logger.info(`Project updated: ${updated.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project (admin only)
 * DELETE /api/projects/:id
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    logger.info(`Project deleted: ${project.title} (${project.code}) by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics (role-scoped)
 * GET /api/projects/stats
 */
const getProjectStats = async (req, res, next) => {
  try {
    const roleScope = buildRoleScope(req.user);

    const [total, inProgress, review, completed, planning] = await Promise.all([
      Project.countDocuments(roleScope),
      Project.countDocuments({ ...roleScope, status: 'in_progress' }),
      Project.countDocuments({ ...roleScope, status: 'review' }),
      Project.countDocuments({ ...roleScope, status: 'completed' }),
      Project.countDocuments({ ...roleScope, status: 'planning' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          inProgress,
          review,
          completed,
          planning,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
};
