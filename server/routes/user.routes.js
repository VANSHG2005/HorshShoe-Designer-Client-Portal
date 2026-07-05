const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

// Zod schemas
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'designer', 'client', 'project_manager']).default('designer'),
  phone: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().optional(),
  clientCompany: z.string().nullable().optional(),
  hourlyRate: z.number().min(0).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'designer', 'client', 'project_manager']).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().optional(),
  clientCompany: z.string().nullable().optional(),
  hourlyRate: z.number().min(0).optional(),
});

// All user routes require authentication
router.use(authenticate);

// Stats route (before /:id)
router.get('/stats', getUserStats);

// List & Create
router
  .route('/')
  .get(getUsers)
  .post(requireRole('admin'), validate(createUserSchema), createUser);

// Get, Update, Delete
router
  .route('/:id')
  .get(getUserById)
  .put(requireRole('admin'), validate(updateUserSchema), updateUser)
  .delete(requireRole('admin'), deleteUser);

module.exports = router;
