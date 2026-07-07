const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} = require('../controllers/project.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(150),
  code: z.string().optional(),
  description: z.string().optional(),
  client: z.string().min(1, 'Client ID is required'),
  leadDesigner: z.string().nullable().optional(),
  team: z.array(z.string()).optional(),
  status: z
    .enum(['planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z
    .enum([
      'Brand Identity',
      'UI/UX Design',
      '3D & Motion',
      'Packaging',
      'Marketing Campaign',
      'Design System',
      'Other',
    ])
    .optional(),
  budget: z.number().min(0).optional(),
  spent: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

// All project routes require authentication
router.use(authenticate);

// Stats route (must be before /:id)
router.get('/stats', getProjectStats);

// List & Create
router
  .route('/')
  .get(getProjects)
  .post(requireRole('admin', 'project_manager'), validate(createProjectSchema), createProject);

// Get, Update, Delete
router
  .route('/:id')
  .get(getProjectById)
  .put(validate(updateProjectSchema), updateProject)
  .delete(requireRole('admin'), deleteProject);

module.exports = router;
