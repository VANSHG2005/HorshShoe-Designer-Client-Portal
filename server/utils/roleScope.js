const Project = require('../models/Project');

/**
 * Get accessible project IDs based on user role
 * - admin/project_manager: null (all projects)
 * - designer: projects where they are lead or team member
 * - client: projects for their company
 * - other: empty array (no access)
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

module.exports = getAccessibleProjectIds;
