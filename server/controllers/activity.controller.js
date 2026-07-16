const Activity = require('../models/Activity');
const Project = require('../models/Project');

/**
 * Get studio audit trail activity logs with role scoping
 * GET /api/activity
 */
const getActivity = async (req, res, next) => {
  try {
    const { action, project, page = 1, limit = 20 } = req.query;
    const query = {};

    // Role-based restrictions
    if (req.user.role === 'designer') {
      const allowedProjects = await Project.find({
        $or: [{ leadDesigner: req.user._id }, { team: req.user._id }],
      }).select('_id');
      query.project = { $in: allowedProjects.map((p) => p._id) };
    } else if (req.user.role === 'client') {
      if (!req.user.clientCompany) {
        return res.status(200).json({ success: true, data: { activities: [], total: 0 } });
      }
      const clientProjects = await Project.find({ client: req.user.clientCompany }).select('_id');
      query.project = { $in: clientProjects.map((p) => p._id) };
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (project && project !== 'all') {
      query.project = project;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('user', 'name email avatarUrl role')
        .populate('project', 'title code')
        .populate('design', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Activity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activities,
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

module.exports = { getActivity };
