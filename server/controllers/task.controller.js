const Task = require('../models/Task');
const Project = require('../models/Project');
const logger = require('../utils/logger');
const { createAndEmitNotification } = require('../utils/notifier');

/**
 * Helper: Recalculate project progress based on completed tasks
 */
const recalculateProjectProgress = async (projectId) => {
  try {
    if (!projectId) return;

    const [totalTasks, doneTasks] = await Promise.all([
      Task.countDocuments({ project: projectId }),
      Task.countDocuments({ project: projectId, status: 'done' }),
    ]);

    if (totalTasks === 0) return;

    const progress = Math.round((doneTasks / totalTasks) * 100);
    const updateData = { progress };
    if (progress === 100) {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    await Project.findByIdAndUpdate(projectId, updateData);
    logger.info(`Project ${projectId} auto-updated progress: ${progress}% (${doneTasks}/${totalTasks} tasks)`);
  } catch (error) {
    logger.error('Failed to recalculate project progress:', error);
  }
};

/**
 * Helper: Get accessible project IDs for role scoping
 */
const getAccessibleProjectIds = async (user) => {
  if (user.role === 'admin' || user.role === 'project_manager') {
    return null; // All projects accessible
  }
  if (user.role === 'designer') {
    const projects = await Project.find({
      $or: [{ leadDesigner: user._id }, { team: user._id }],
    }).select('_id');
    return projects.map((p) => p._id);
  }
  if (user.role === 'client') {
    if (!user.clientCompany) return [];
    const projects = await Project.find({ client: user.clientCompany }).select('_id');
    return projects.map((p) => p._id);
  }
  return [];
};

/**
 * Get tasks with filtering and role scoping
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const { project, assignee, status, priority, search } = req.query;

    const query = {};

    // Role-based project restrictions
    const accessibleIds = await getAccessibleProjectIds(req.user);
    if (accessibleIds !== null) {
      query.project = { $in: accessibleIds };
    }

    if (project && project !== 'all') {
      // If user provided a specific project filter, ensure it's in their accessible list
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

    if (assignee && assignee !== 'all') {
      query.assignee = assignee;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('project', 'title code status client')
      .populate('assignee', 'name email avatarUrl role')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title code status client leadDesigner team')
      .populate('assignee', 'name email avatarUrl role phone')
      .populate('createdBy', 'name email')
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project: projectId,
      assignee,
      status,
      priority,
      dueDate,
      estimatedHours,
      tags,
    } = req.body;

    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Role check: Designer can only create tasks for projects they lead/work on
    if (req.user.role === 'designer') {
      const isAssigned =
        projectDoc.leadDesigner?.toString() === req.user._id.toString() ||
        projectDoc.team?.some((m) => m.toString() === req.user._id.toString());
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this project',
        });
      }
    }

    // Determine order
    const countInColumn = await Task.countDocuments({ project: projectId, status: status || 'todo' });

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee: assignee || null,
      status: status || 'todo',
      priority: priority || 'medium',
      order: countInColumn,
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || 0,
      tags: tags || [],
      createdBy: req.user._id,
      completedAt: status === 'done' ? new Date() : null,
    });

    // Auto-update project progress
    await recalculateProjectProgress(projectId);

    // Notify assignee in real time
    if (task.assignee) {
      await createAndEmitNotification({
        recipient: task.assignee,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you to "${task.title}" in ${projectDoc.title}`,
        link: '/dashboard/tasks',
      });
    }

    const populated = await Task.findById(task._id)
      .populate('project', 'title code status client')
      .populate('assignee', 'name email avatarUrl role');

    logger.info(`Task created: ${task.title} for project ${projectDoc.code} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const {
      title,
      description,
      assignee,
      status,
      priority,
      order,
      dueDate,
      estimatedHours,
      actualHours,
      tags,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignee !== undefined) updateData.assignee = assignee || null;
    if (priority !== undefined) updateData.priority = priority;
    if (order !== undefined) updateData.order = order;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (tags !== undefined) updateData.tags = tags;

    if (status !== undefined && status !== task.status) {
      updateData.status = status;
      updateData.completedAt = status === 'done' ? new Date() : null;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'title code status client')
      .populate('assignee', 'name email avatarUrl role');

    // If status was changed, recalculate project progress
    if (status !== undefined && status !== task.status) {
      await recalculateProjectProgress(task.project);
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick status update (for Kanban drag & drop)
 * PATCH /api/tasks/:id/status
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const updateData = { status };
    if (order !== undefined) updateData.order = order;
    if (status === 'done' && task.status !== 'done') {
      updateData.completedAt = new Date();
    } else if (status !== 'done') {
      updateData.completedAt = null;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('project', 'title code status client')
      .populate('assignee', 'name email avatarUrl role');

    await recalculateProjectProgress(task.project);

    res.status(200).json({
      success: true,
      message: `Task moved to ${status}`,
      data: { task: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const projectId = task.project;
    await Task.findByIdAndDelete(req.params.id);

    // Recalculate progress for remaining tasks
    await recalculateProjectProgress(projectId);

    logger.info(`Task deleted: ${task.title} (${req.params.id}) by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task statistics (role-scoped)
 * GET /api/tasks/stats
 */
const getTaskStats = async (req, res, next) => {
  try {
    const query = {};
    const accessibleIds = await getAccessibleProjectIds(req.user);
    if (accessibleIds !== null) {
      query.project = { $in: accessibleIds };
    }

    const [total, todo, inProgress, review, done] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'todo' }),
      Task.countDocuments({ ...query, status: 'in_progress' }),
      Task.countDocuments({ ...query, status: 'review' }),
      Task.countDocuments({ ...query, status: 'done' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          todo,
          inProgress,
          review,
          done,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
};
