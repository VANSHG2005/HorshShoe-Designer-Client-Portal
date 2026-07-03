const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { register, login, refresh, logout, getMe, updateProfile } = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

// ── Validation Schemas ──────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['designer', 'client', 'project_manager']).optional().default('designer'),
  phone: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

// ── Routes ──────────────────────────────────────────────────

// POST /api/auth/register — Admin only
router.post(
  '/register',
  authenticate,
  requireRole('admin'),
  validate(registerSchema),
  register
);

// POST /api/auth/login — Public (rate-limited in server.js)
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh — Public (uses httpOnly cookie)
router.post('/refresh', refresh);

// POST /api/auth/logout — Authenticated
router.post('/logout', authenticate, logout);

// GET /api/auth/me — Authenticated
router.get('/me', authenticate, getMe);

// PUT /api/auth/profile — Authenticated
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

module.exports = router;
