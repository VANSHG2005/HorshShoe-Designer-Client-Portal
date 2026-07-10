const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
} = require('../controllers/task.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  project: z.string().min(1, 'Project ID is required'),
  assignee: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  order: z.number().optional(),
  actualHours: z.number().min(0).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  order: z.number().optional(),
});

// All task routes require authentication
router.use(authenticate);

// Stats route (before /:id)
router.get('/stats', getTaskStats);

// List & Create
router.route('/').get(getTasks).post(validate(createTaskSchema), createTask);

// Quick status patch (for Kanban)
router.patch('/:id/status', validate(updateStatusSchema), updateTaskStatus);

// Get, Update, Delete
router.route('/:id').get(getTaskById).put(validate(updateTaskSchema), updateTask).delete(deleteTask);

module.exports = router;
