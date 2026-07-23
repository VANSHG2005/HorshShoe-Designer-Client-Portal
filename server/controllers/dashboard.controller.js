const Project = require('../models/Project');
const Task = require('../models/Task');
const Design = require('../models/Design');
const Client = require('../models/Client');
const User = require('../models/User');
const Activity = require('../models/Activity');
const getAccessibleProjectIds = require('../utils/roleScope');

/**
 * Get dashboard KPI counters, pending approvals, and recent activity
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const accessibleIds = await getAccessibleProjectIds(req.user);
    const projectFilter = accessibleIds !== null ? { _id: { $in: accessibleIds } } : {};
    const taskProjectFilter = accessibleIds !== null ? { project: { $in: accessibleIds } } : {};
    const designProjectFilter = accessibleIds !== null ? { project: { $in: accessibleIds } } : {};

    // 1. Projects metrics
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: { $in: ['in_progress', 'review', 'planning'] } }),
      Project.countDocuments({ ...projectFilter, status: 'completed' }),
    ]);

    // 2. Tasks metrics
    const taskFilter = req.user.role === 'designer'
      ? { ...taskProjectFilter, assignee: req.user._id }
      : taskProjectFilter;

    const [totalTasks, openTasks, completedTasks] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: { $ne: 'done' } }),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
    ]);

    // 3. Designs & Approvals metrics
    const [totalDesigns, pendingApprovals, approvedDesigns, changesRequestedDesigns] = await Promise.all([
      Design.countDocuments(designProjectFilter),
      Design.countDocuments({ ...designProjectFilter, status: { $in: ['pending', 'in_review'] } }),
      Design.countDocuments({ ...designProjectFilter, status: 'approved' }),
      Design.countDocuments({ ...designProjectFilter, status: 'changes_requested' }),
    ]);

    // 4. Clients / Users count
    let clientCount = 0;
    let teamCount = 0;
    if (req.user.role === 'admin' || req.user.role === 'project_manager') {
      [clientCount, teamCount] = await Promise.all([
        Client.countDocuments({ status: 'active' }),
        User.countDocuments({ role: { $in: ['designer', 'project_manager'] }, isActive: true }),
      ]);
    }

    // 5. Actionable Pending Design Approvals (top 4 needing review)
    const pendingReviewDesigns = await Design.find({
      ...designProjectFilter,
      status: { $in: ['pending', 'in_review', 'changes_requested'] },
    })
      .populate('project', 'title code')
      .populate('createdBy', 'name email avatarUrl')
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean();

    // 6. Recent Activity Feed
    const activityQuery = accessibleIds !== null ? { project: { $in: accessibleIds } } : {};
    const recentActivity = await Activity.find(activityQuery)
      .populate('user', 'name avatarUrl role')
      .populate('project', 'title code')
      .populate('design', 'title')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          openTasks,
          completedTasks,
          totalDesigns,
          pendingApprovals,
          approvedDesigns,
          changesRequestedDesigns,
          clientCount,
          teamCount,
        },
        pendingReviewDesigns,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated chart data for Recharts visualizations
 * GET /api/dashboard/charts
 */
const getDashboardCharts = async (req, res, next) => {
  try {
    const accessibleIds = await getAccessibleProjectIds(req.user);
    const projectFilter = accessibleIds !== null ? { _id: { $in: accessibleIds } } : {};
    const taskProjectFilter = accessibleIds !== null ? { project: { $in: accessibleIds } } : {};
    const designProjectFilter = accessibleIds !== null ? { project: { $in: accessibleIds } } : {};

    // 1. Projects by Status Distribution
    const projectsByStatusRaw = await Project.aggregate([
      { $match: projectFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = {
      planning: { label: 'Planning', color: '#6366F1' },
      in_progress: { label: 'In Progress', color: '#0EA5E9' },
      review: { label: 'In Review', color: '#F59E0B' },
      completed: { label: 'Completed', color: '#10B981' },
      on_hold: { label: 'On Hold', color: '#94A3B8' },
      cancelled: { label: 'Cancelled', color: '#EF4444' },
    };

    const projectsByStatus = Object.keys(statusMap).map((st) => {
      const match = projectsByStatusRaw.find((p) => p._id === st);
      return {
        name: statusMap[st].label,
        status: st,
        value: match ? match.count : 0,
        color: statusMap[st].color,
      };
    });

    // 2. Deliverables Approval Health
    const designsByStatusRaw = await Design.aggregate([
      { $match: designProjectFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const designStatusMap = {
      approved: { name: 'Approved', color: '#10B981' },
      changes_requested: { name: 'Revisions', color: '#F43F5E' },
      in_review: { name: 'In Review', color: '#F59E0B' },
      pending: { name: 'Pending', color: '#8B5CF6' },
    };

    const deliverablesHealth = Object.keys(designStatusMap).map((st) => {
      const match = designsByStatusRaw.find((d) => d._id === st);
      return {
        name: designStatusMap[st].name,
        value: match ? match.count : 0,
        color: designStatusMap[st].color,
      };
    });

    // 3. Designer Workload / Task Distribution
    const designers = await User.find({ role: 'designer', isActive: true })
      .select('name avatarUrl')
      .limit(6);

    const workloadPromises = designers.map(async (designer) => {
      const [todo, in_progress, review, done] = await Promise.all([
        Task.countDocuments({ ...taskProjectFilter, assignee: designer._id, status: 'todo' }),
        Task.countDocuments({ ...taskProjectFilter, assignee: designer._id, status: 'in_progress' }),
        Task.countDocuments({ ...taskProjectFilter, assignee: designer._id, status: 'review' }),
        Task.countDocuments({ ...taskProjectFilter, assignee: designer._id, status: 'done' }),
      ]);
      return {
        name: designer.name.split(' ')[0],
        fullName: designer.name,
        todo,
        in_progress,
        review,
        done,
        total: todo + in_progress + review + done,
      };
    });

    const designerWorkload = await Promise.all(workloadPromises);

    // 4. Tasks by Priority
    const priorityAggregation = await Task.aggregate([
      { $match: taskProjectFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityColors = {
      urgent: '#EF4444',
      high: '#F97316',
      medium: '#F59E0B',
      low: '#10B981',
    };

    const tasksByPriority = ['urgent', 'high', 'medium', 'low'].map((p) => {
      const match = priorityAggregation.find((item) => item._id === p);
      return {
        priority: p.charAt(0).toUpperCase() + p.slice(1),
        count: match ? match.count : 0,
        fill: priorityColors[p],
      };
    });

    res.status(200).json({
      success: true,
      data: {
        projectsByStatus,
        deliverablesHealth,
        designerWorkload,
        tasksByPriority,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardCharts,
};
